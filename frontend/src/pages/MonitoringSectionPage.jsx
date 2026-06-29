import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Typography,
  Button,
  Paper,
  Card,
  CardContent,
  Grid,
  CircularProgress,
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  Menu,
  MenuItem,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Chip,
} from "@mui/material";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Eye,
  FileText,
  Folder,
  FolderPlus,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
  TrendingUp,
  Download,
} from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import api, {
  createSiteSubfolder,
  deleteSiteSubfolder,
  fetchFormResponsesList,
  fetchSiteSubfolders,
  fetchSites,
  updateSiteSubfolder,
} from "../services/api";
import { getMonitoringSection } from "../constants/monitoringSections";
import {
  belongsInMonitoringSubmission,
  buildMonitoringBuilderFormUrl,
  buildMonitoringFormUrl,
  buildMonitoringSavedTemplateUrl,
  buildMonitoringSubmissionUrl,
  filterMonitoringBuilderForms,
  filterMonitoringSavedTemplates,
  filterMonitoringTemplates,
  formatMonitoringDate,
  getMonitoringSubmissionTitle,
  isMonitoringCustomBuilderSubmission,
  monitoringFolderPath,
  monitoringSitePath,
} from "../utils/monitoringContext";
import { formatUserDisplayName } from "../utils/plainName";
import { isGeneralFormsPageSubmission } from "../utils/generalFormSubmissions";
import { fetchWithCache } from "../utils/fetchCache";

const ROWS_PER_PAGE_OPTIONS = [5, 10, 25];
const TEMPLATE_TAB_LIBRARY = "library";
const TEMPLATE_TAB_SAVED = "saved";
const TEMPLATE_TAB_BUILDER = "builder";

function getSiteId(site) {
  return site?._id || site?.id;
}

function formatSiteCreatedBy(site) {
  const managers = site?.managers?.length
    ? site.managers
    : (site?.siteManagers || []).map((row) => row.user).filter(Boolean);
  if (managers.length) {
    return managers.map((user) => formatUserDisplayName(user)).join(", ");
  }
  if (site?.manager) return formatUserDisplayName(site.manager);
  return "—";
}

export default function MonitoringSectionPage({ section: sectionKey }) {
  const { isDarkMode } = useTheme();
  const { role } = useAuth();
  const navigate = useNavigate();
  const { siteId: routeSiteId, folderId: routeFolderId } = useParams();

  const section = getMonitoringSection(sectionKey);

  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState(null);
  const [folders, setFolders] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingFolders, setLoadingFolders] = useState(false);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [siteSearch, setSiteSearch] = useState("");
  const [templateSearch, setTemplateSearch] = useState("");
  const [templatePickerTab, setTemplatePickerTab] = useState(TEMPLATE_TAB_LIBRARY);
  const [savedSubmissions, setSavedSubmissions] = useState([]);
  const [builderForms, setBuilderForms] = useState([]);
  const [pickerLoading, setPickerLoading] = useState(false);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [folderDialogMode, setFolderDialogMode] = useState("create");
  const [editingFolder, setEditingFolder] = useState(null);
  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState(null);
  const [deletingFolder, setDeletingFolder] = useState(false);
  const [folderPickerOpen, setFolderPickerOpen] = useState(false);
  const [templateFolderId, setTemplateFolderId] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [formPanelOpen, setFormPanelOpen] = useState(false);
  const [formPanelUrl, setFormPanelUrl] = useState("");
  const [formPanelTitle, setFormPanelTitle] = useState("");
  const [formPanelMode, setFormPanelMode] = useState("view");
  const [formPanelRow, setFormPanelRow] = useState(null);
  const formPanelWasEditRef = useRef(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [menuAnchor, setMenuAnchor] = useState(null);
  const [menuRow, setMenuRow] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });

  const headingColor = isDarkMode ? "#F9FAFB" : "#111827";
  const subColor = isDarkMode ? "#9CA3AF" : "#6B7280";
  const borderColor = isDarkMode ? "#374151" : "#E5E7EB";
  const surfaceBg = isDarkMode ? "#1B212C" : "#FFFFFF";

  const loadSites = useCallback(async () => {
    setLoadingSites(true);
    try {
      const data = await fetchWithCache("monitoring-sites", () => fetchSites(""), {
        ttlMs: 120_000,
      });
      setSites((data || []).filter((site) => site.isActive !== false));
    } catch (error) {
      console.error("Failed to load sites", error);
      setSnack({
        open: true,
        message: "Could not load sites. Please try again.",
        severity: "error",
      });
    } finally {
      setLoadingSites(false);
    }
  }, []);

  const loadFolders = useCallback(async (siteId) => {
    if (!siteId) return;
    setLoadingFolders(true);
    try {
      const { subfolders } = await fetchSiteSubfolders(siteId, {
        monitoringSection: sectionKey,
      });
      setFolders(subfolders || []);
    } catch (error) {
      console.error("Failed to load folders", error);
      setSnack({
        open: true,
        message: "Could not load folders for this site.",
        severity: "warning",
      });
      setFolders([]);
    } finally {
      setLoadingFolders(false);
    }
  }, [sectionKey]);

  const loadSubmissions = useCallback(
    async (siteId, folderId) => {
      if (!siteId || !folderId || !section) return;
      setLoadingSubmissions(true);
      try {
        const res = await fetchFormResponsesList({ siteId, subfolderId: folderId });
        const rows = (res?.data || []).filter((row) =>
          belongsInMonitoringSubmission(row, sectionKey, { siteId, folderId })
        );
        rows.sort((a, b) => {
          const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
          const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
          return bTime - aTime;
        });
        setSubmissions(rows);
      } catch (error) {
        console.error("Failed to load monitoring forms", error);
        setSnack({
          open: true,
          message: "Could not load saved forms for this folder.",
          severity: "error",
        });
      } finally {
        setLoadingSubmissions(false);
      }
    },
    [section, sectionKey]
  );

  useEffect(() => {
    loadSites();
  }, [loadSites]);

  useEffect(() => {
    if (!routeSiteId) {
      setSelectedSite(null);
      setFolders([]);
      setSelectedFolder(null);
      setSubmissions([]);
      return;
    }
    loadFolders(routeSiteId);
  }, [routeSiteId, loadFolders]);

  useEffect(() => {
    if (!routeSiteId) return;
    if (loadingSites) return;
    const match = sites.find((site) => getSiteId(site) === routeSiteId);
    if (match) setSelectedSite(match);
    else setSelectedSite({ id: routeSiteId, _id: routeSiteId, name: "Site" });
  }, [routeSiteId, sites, loadingSites]);

  useEffect(() => {
    if (!routeSiteId || !routeFolderId) {
      setSelectedFolder(null);
      setSubmissions([]);
      return;
    }
    loadSubmissions(routeSiteId, routeFolderId);
  }, [routeSiteId, routeFolderId, loadSubmissions]);

  useEffect(() => {
    if (!routeFolderId || loadingFolders) return;
    const match = folders.find((folder) => folder.id === routeFolderId);
    if (match) setSelectedFolder(match);
    else setSelectedFolder({ id: routeFolderId, name: "Folder" });
  }, [routeFolderId, folders, loadingFolders]);

  const filteredSites = useMemo(() => {
    const q = siteSearch.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((site) => {
      const name = (site.name || "").toLowerCase();
      const address = (site.address || "").toLowerCase();
      const createdBy = formatSiteCreatedBy(site).toLowerCase();
      return name.includes(q) || address.includes(q) || createdBy.includes(q);
    });
  }, [sites, siteSearch]);

  const filteredTemplates = useMemo(
    () => filterMonitoringTemplates(templateSearch),
    [templateSearch]
  );

  const filteredSavedSubmissions = useMemo(
    () => filterMonitoringSavedTemplates(savedSubmissions, templateSearch),
    [savedSubmissions, templateSearch]
  );

  const filteredBuilderForms = useMemo(
    () => filterMonitoringBuilderForms(builderForms, templateSearch),
    [builderForms, templateSearch]
  );

  useEffect(() => {
    if (!templateDialogOpen) return undefined;
    let cancelled = false;
    const loadPickerData = async () => {
      setPickerLoading(true);
      setSavedSubmissions([]);
      setBuilderForms([]);
      try {
        const [responsesRes, formsRes] = await Promise.all([
          fetchFormResponsesList({ category: "General forms," }),
          api.get("/forms"),
        ]);
        if (cancelled) return;
        if (responsesRes?.success) {
          const saved = (responsesRes.data || [])
            .filter(isGeneralFormsPageSubmission)
            .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          setSavedSubmissions(saved);
        }
        if (formsRes.data?.success) {
          const userCreatedForms = (formsRes.data.data || []).filter(
            (form) =>
              !(
                form.fields?.length === 1 &&
                form.fields[0].id === "custom_hardcoded_form_data"
              )
          );
          setBuilderForms(userCreatedForms);
        }
      } catch (error) {
        console.error("Failed to load template picker data", error);
      } finally {
        if (!cancelled) setPickerLoading(false);
      }
    };
    loadPickerData();
    return () => {
      cancelled = true;
    };
  }, [templateDialogOpen]);

  const paginatedRows = submissions.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  if (!section) {
    return (
      <Layout pageTitle="Monitoring">
        <Typography sx={{ color: subColor }}>Unknown monitoring section.</Typography>
      </Layout>
    );
  }

  const handleOpenSite = (site) => {
    navigate(monitoringSitePath(sectionKey, getSiteId(site)));
  };

  const handleOpenFolder = (folder) => {
    navigate(monitoringFolderPath(sectionKey, routeSiteId, folder.id));
  };

  const handleBack = () => {
    if (routeFolderId) {
      navigate(monitoringSitePath(sectionKey, routeSiteId));
      return;
    }
    if (routeSiteId) {
      navigate(section.basePath);
      return;
    }
  };

  const openCreateFolderDialog = () => {
    setFolderDialogMode("create");
    setEditingFolder(null);
    setNewFolderName("");
    setFolderDialogOpen(true);
  };

  const openEditFolderDialog = (folder) => {
    setFolderDialogMode("edit");
    setEditingFolder(folder);
    setNewFolderName(folder.name || "");
    setFolderDialogOpen(true);
  };

  const closeTemplateDialog = () => {
    setTemplateDialogOpen(false);
    setTemplateFolderId(null);
    setTemplatePickerTab(TEMPLATE_TAB_LIBRARY);
    setTemplateSearch("");
  };

  const openTemplateDialog = () => {
    setTemplatePickerTab(TEMPLATE_TAB_LIBRARY);
    setTemplateSearch("");
    if (insideFolder) {
      setTemplateFolderId(routeFolderId);
      setTemplateDialogOpen(true);
      return;
    }
    if (insideSite) {
      if (folders.length === 0) {
        setSnack({
          open: true,
          message: "Create a folder first, then select a template to add forms.",
          severity: "info",
        });
        return;
      }
      if (folders.length === 1) {
        setTemplateFolderId(folders[0].id);
        setTemplateDialogOpen(true);
        return;
      }
      setFolderPickerOpen(true);
    }
  };

  const handlePickFolderForTemplate = (folderId) => {
    setTemplateFolderId(folderId);
    setFolderPickerOpen(false);
    setTemplatePickerTab(TEMPLATE_TAB_LIBRARY);
    setTemplateSearch("");
    setTemplateDialogOpen(true);
  };

  const activeTemplateFolderId = routeFolderId || templateFolderId;

  const handleUseTemplate = (template) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const url = buildMonitoringFormUrl(template, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: false,
    });
    closeTemplateDialog();
    navigate(url);
  };

  const handlePreviewTemplate = (template) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const url = buildMonitoringFormUrl(template, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: true,
    });
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleUseSavedTemplate = (submission) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const url = buildMonitoringSavedTemplateUrl(submission, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: false,
    });
    if (!url) {
      setSnack({
        open: true,
        message: "This saved template cannot be opened from monitoring.",
        severity: "warning",
      });
      return;
    }
    closeTemplateDialog();
    navigate(url);
  };

  const handlePreviewSavedTemplate = (submission) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const url = buildMonitoringSavedTemplateUrl(submission, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: true,
    });
    if (!url) return;
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleUseBuilderForm = (form) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const formId = form._id || form.id;
    if (!formId) return;
    const url = buildMonitoringBuilderFormUrl(formId, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: false,
    });
    closeTemplateDialog();
    navigate(url);
  };

  const handlePreviewBuilderForm = (form) => {
    if (!routeSiteId || !activeTemplateFolderId) return;
    const formId = form._id || form.id;
    if (!formId) return;
    const url = buildMonitoringBuilderFormUrl(formId, {
      sectionKey,
      siteId: routeSiteId,
      folderId: activeTemplateFolderId,
      preview: true,
    });
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const handleSaveFolder = async () => {
    const name = newFolderName.trim();
    if (!name || !routeSiteId) return;
    setCreatingFolder(true);
    try {
      if (folderDialogMode === "edit" && editingFolder?.id) {
        await updateSiteSubfolder(routeSiteId, editingFolder.id, name);
        setSnack({ open: true, message: "Folder updated.", severity: "success" });
        setFolderDialogOpen(false);
        setNewFolderName("");
        setEditingFolder(null);
        await loadFolders(routeSiteId);
        return;
      }

      const { subfolder } = await createSiteSubfolder(routeSiteId, name, {
        monitoringSection: sectionKey,
      });
      setSnack({ open: true, message: "Folder created.", severity: "success" });
      setFolderDialogOpen(false);
      setNewFolderName("");
      await loadFolders(routeSiteId);
      if (subfolder?.id) {
        navigate(monitoringFolderPath(sectionKey, routeSiteId, subfolder.id));
      }
    } catch (error) {
      console.error("Save folder failed", error);
      setSnack({
        open: true,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not save folder.",
        severity: "error",
      });
    } finally {
      setCreatingFolder(false);
    }
  };

  const handleDeleteFolder = async () => {
    if (!folderDeleteTarget?.id || !routeSiteId) return;
    setDeletingFolder(true);
    try {
      await deleteSiteSubfolder(routeSiteId, folderDeleteTarget.id);
      setSnack({ open: true, message: "Folder deleted.", severity: "success" });
      setFolderDeleteTarget(null);
      if (routeFolderId === folderDeleteTarget.id) {
        navigate(monitoringSitePath(sectionKey, routeSiteId));
        return;
      }
      await loadFolders(routeSiteId);
    } catch (error) {
      console.error("Delete folder failed", error);
      setSnack({
        open: true,
        message:
          error?.response?.data?.message ||
          error?.response?.data?.error ||
          "Could not delete folder.",
        severity: "error",
      });
    } finally {
      setDeletingFolder(false);
    }
  };

  const getSubmissionTitle = (row) => getMonitoringSubmissionTitle(row);

  const openFormPanel = (row, mode) => {
    if (!row || !routeSiteId || !routeFolderId) return;
    const url = buildMonitoringSubmissionUrl(row, {
      sectionKey,
      siteId: routeSiteId,
      folderId: routeFolderId,
      mode,
    });
    if (!url) {
      setSnack({
        open: true,
        message: "This form cannot be opened from monitoring.",
        severity: "warning",
      });
      return;
    }
    formPanelWasEditRef.current = mode === "edit";
    setFormPanelRow(row);
    setFormPanelTitle(getSubmissionTitle(row));
    setFormPanelMode(mode);
    setFormPanelUrl(url);
    setFormPanelOpen(true);
  };

  const closeFormPanel = () => {
    setFormPanelOpen(false);
    setFormPanelUrl("");
    setFormPanelRow(null);
    if (formPanelWasEditRef.current && routeSiteId && routeFolderId) {
      loadSubmissions(routeSiteId, routeFolderId);
    }
    formPanelWasEditRef.current = false;
  };

  const downloadSubmission = (row, format) => {
    if (!row || !routeSiteId || !routeFolderId) return;
    const mode = format === "word" ? "download_word" : "download_pdf";
    const url = buildMonitoringSubmissionUrl(row, {
      sectionKey,
      siteId: routeSiteId,
      folderId: routeFolderId,
      mode,
    });
    if (!url) {
      setSnack({
        open: true,
        message: "Download is not available for this form.",
        severity: "warning",
      });
      return;
    }
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const openSubmission = (row, mode) => {
    openFormPanel(row, mode);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const id = deleteTarget.id || deleteTarget._id;
      await api.delete(`/forms/responses/${id}`);
      setSnack({ open: true, message: "Form deleted.", severity: "success" });
      setDeleteTarget(null);
      await loadSubmissions(routeSiteId, routeFolderId);
      const maxPage = Math.max(0, Math.ceil((submissions.length - 1) / rowsPerPage) - 1);
      if (page > maxPage) setPage(maxPage);
    } catch (error) {
      console.error("Delete failed", error);
      setSnack({
        open: true,
        message: error?.response?.data?.message || "Could not delete this form.",
        severity: "error",
      });
    } finally {
      setDeleting(false);
    }
  };

  const siteName = selectedSite?.name || "Site";
  const folderName = selectedFolder?.name || "Folder";
  const insideFolder = Boolean(routeSiteId && routeFolderId);
  const insideSite = Boolean(routeSiteId && !routeFolderId);

  const actionButtons = insideFolder || insideSite ? (
    <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", justifyContent: "flex-end" }}>
      {insideSite ? (
        <Button
          variant="outlined"
          startIcon={<FolderPlus size={18} />}
          onClick={openCreateFolderDialog}
          sx={{
            textTransform: "none",
            fontWeight: 600,
            borderColor,
            color: headingColor,
          }}
        >
          Create folder
        </Button>
      ) : null}
      <Button
        variant="contained"
        startIcon={<Plus size={18} />}
        onClick={openTemplateDialog}
        sx={{
          bgcolor: "#E89F17",
          textTransform: "none",
          fontWeight: 600,
          borderRadius: "8px",
          boxShadow: "none",
          "&:hover": { bgcolor: "#cc8b14", boxShadow: "none" },
        }}
      >
        Select template / form
      </Button>
    </Box>
  ) : null;

  return (
    <Layout pageTitle={insideFolder ? folderName : routeSiteId ? siteName : section.title}>
      <Box sx={{ width: "100%", minWidth: 0, py: 2 }}>
        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5, minWidth: 0 }}>
            {routeSiteId ? (
              <IconButton
                onClick={handleBack}
                aria-label="Back"
                sx={{
                  mt: 0.25,
                  bgcolor: isDarkMode ? "#374151" : "#E5E7EB",
                  color: headingColor,
                  "&:hover": { bgcolor: isDarkMode ? "#4B5563" : "#D1D5DB" },
                }}
              >
                <ArrowLeft size={18} />
              </IconButton>
            ) : (
              <Box
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  bgcolor: "rgba(232, 159, 23, 0.12)",
                  color: "#E89F17",
                  display: "flex",
                  flexShrink: 0,
                }}
              >
                <TrendingUp size={22} />
              </Box>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                {insideFolder ? folderName : routeSiteId ? siteName : section.title}
              </Typography>
              <Typography sx={{ color: subColor, fontSize: "0.95rem", maxWidth: 720 }}>
                {insideFolder
                  ? `${section.title} — select a template to fill, or review saved forms in this folder.`
                  : routeSiteId
                    ? `${section.title} — open a folder or create one to organise forms for this site.`
                    : section.subtitle}
              </Typography>
            </Box>
          </Box>
          {actionButtons}
        </Box>

        {!routeSiteId ? (
          <>
            <TextField
              fullWidth
              size="small"
              placeholder="Search sites..."
              value={siteSearch}
              onChange={(e) => setSiteSearch(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search size={18} color={subColor} />
                  </InputAdornment>
                ),
                sx: { borderRadius: 2, bgcolor: surfaceBg },
              }}
              sx={{ mb: 3, maxWidth: 420 }}
            />

            {loadingSites ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "#E89F17" }} />
              </Box>
            ) : (
              <Paper
                elevation={0}
                sx={{
                  borderRadius: 3,
                  border: `1px solid ${borderColor}`,
                  bgcolor: surfaceBg,
                  overflow: "hidden",
                }}
              >
                {filteredSites.length === 0 ? (
                  <Box sx={{ p: 6, textAlign: "center" }}>
                    <Typography sx={{ color: subColor }}>
                      {siteSearch.trim() || role === "company_admin" || role === "superadmin"
                        ? "No sites found."
                        : "No sites assigned to you yet. Ask your company admin to create a site."}
                    </Typography>
                  </Box>
                ) : (
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow
                          sx={{
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F9FAFB",
                            "& th": {
                              fontWeight: 600,
                              color: subColor,
                              fontSize: "0.8rem",
                              textTransform: "uppercase",
                              letterSpacing: "0.04em",
                              borderBottom: `1px solid ${borderColor}`,
                            },
                          }}
                        >
                          <TableCell width={72}>SL No</TableCell>
                          <TableCell>Site</TableCell>
                          <TableCell>Address</TableCell>
                          <TableCell width={200}>Created by</TableCell>
                          <TableCell width={140} align="right">
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredSites.map((site, index) => (
                          <TableRow
                            key={getSiteId(site)}
                            hover
                            sx={{ "& td": { borderBottom: `1px solid ${borderColor}` } }}
                          >
                            <TableCell sx={{ color: headingColor, fontWeight: 500 }}>
                              {index + 1}
                            </TableCell>
                            <TableCell sx={{ color: headingColor, fontWeight: 600 }}>
                              {site.name}
                            </TableCell>
                            <TableCell sx={{ color: subColor }}>{site.address || "—"}</TableCell>
                            <TableCell sx={{ color: subColor }}>
                              {formatSiteCreatedBy(site)}
                            </TableCell>
                            <TableCell align="right">
                              <Button
                                variant="contained"
                                size="small"
                                endIcon={<ArrowRight size={16} />}
                                onClick={() => handleOpenSite(site)}
                                sx={{
                                  bgcolor: "#E89F17",
                                  textTransform: "none",
                                  fontWeight: 600,
                                  boxShadow: "none",
                                  "&:hover": { bgcolor: "#cc8b14", boxShadow: "none" },
                                }}
                              >
                                Open site
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}
              </Paper>
            )}
          </>
        ) : insideSite ? (
          loadingFolders ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
              <CircularProgress sx={{ color: "#E89F17" }} />
            </Box>
          ) : folders.length === 0 ? (
            <Paper
              elevation={0}
              sx={{
                p: 6,
                textAlign: "center",
                borderRadius: 3,
                border: `1px solid ${borderColor}`,
                bgcolor: surfaceBg,
              }}
            >
              <Typography sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                No folders yet
              </Typography>
              <Typography sx={{ color: subColor, fontSize: "0.9rem", mb: 3 }}>
                Create a folder to organise monitoring forms for this site.
              </Typography>
              <Button
                variant="contained"
                startIcon={<FolderPlus size={18} />}
                onClick={openCreateFolderDialog}
                sx={{
                  bgcolor: "#E89F17",
                  textTransform: "none",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "#cc8b14" },
                }}
              >
                Create folder
              </Button>
            </Paper>
          ) : (
            <Grid container spacing={2.5}>
              {folders.map((folder) => (
                <Grid item xs={12} sm={6} md={4} key={folder.id}>
                  <Card
                    elevation={0}
                    sx={{
                      border: `1px solid ${borderColor}`,
                      borderRadius: 3,
                      bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                    }}
                  >
                    <CardContent sx={{ p: 2.5 }}>
                      <Box sx={{ display: "flex", gap: 1.5, mb: 2, alignItems: "flex-start" }}>
                        <Box
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            bgcolor: "rgba(232, 159, 23, 0.12)",
                            color: "#E89F17",
                            display: "flex",
                            flexShrink: 0,
                          }}
                        >
                          <Folder size={20} />
                        </Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography sx={{ fontWeight: 600, color: headingColor }}>
                            {folder.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: subColor, mt: 0.25 }}>
                            Open to view and add forms
                          </Typography>
                        </Box>
                        <Box sx={{ display: "flex", gap: 0.5, flexShrink: 0 }}>
                          <IconButton
                            size="small"
                            aria-label={`Edit ${folder.name}`}
                            onClick={() => openEditFolderDialog(folder)}
                            sx={{
                              color: subColor,
                              "&:hover": { color: "#E89F17", bgcolor: "rgba(232, 159, 23, 0.1)" },
                            }}
                          >
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton
                            size="small"
                            aria-label={`Delete ${folder.name}`}
                            onClick={() => setFolderDeleteTarget(folder)}
                            sx={{
                              color: subColor,
                              "&:hover": { color: "#EF4444", bgcolor: "rgba(239, 68, 68, 0.1)" },
                            }}
                          >
                            <Trash2 size={16} />
                          </IconButton>
                        </Box>
                      </Box>
                      <Button
                        fullWidth
                        variant="contained"
                        endIcon={<ArrowRight size={16} />}
                        onClick={() => handleOpenFolder(folder)}
                        sx={{
                          bgcolor: "#E89F17",
                          textTransform: "none",
                          fontWeight: 600,
                          boxShadow: "none",
                          "&:hover": { bgcolor: "#cc8b14", boxShadow: "none" },
                        }}
                      >
                        Open folder
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )
        ) : (
          <Paper
            elevation={0}
            sx={{
              borderRadius: 3,
              border: `1px solid ${borderColor}`,
              bgcolor: surfaceBg,
              overflow: "hidden",
            }}
          >
            {loadingSubmissions ? (
              <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
                <CircularProgress sx={{ color: "#E89F17" }} />
              </Box>
            ) : submissions.length === 0 ? (
              <Box sx={{ py: 8, px: 3, textAlign: "center" }}>
                <Typography sx={{ fontWeight: 600, color: headingColor, mb: 0.5 }}>
                  No saved forms yet
                </Typography>
                <Typography sx={{ color: subColor, fontSize: "0.9rem", mb: 3 }}>
                  Select a template or form to fill in fields and save for this folder.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Plus size={18} />}
                  onClick={openTemplateDialog}
                  sx={{
                    bgcolor: "#E89F17",
                    textTransform: "none",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#cc8b14" },
                  }}
                >
                  Select template / form
                </Button>
              </Box>
            ) : (
              <>
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow
                        sx={{
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F9FAFB",
                          "& th": {
                            fontWeight: 600,
                            color: subColor,
                            fontSize: "0.8rem",
                            textTransform: "uppercase",
                            letterSpacing: "0.04em",
                            borderBottom: `1px solid ${borderColor}`,
                          },
                        }}
                      >
                        <TableCell width={72}>SL No</TableCell>
                        <TableCell>Form</TableCell>
                        <TableCell width={160}>Saved</TableCell>
                        <TableCell width={90} align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRows.map((row, index) => {
                        const slNo = page * rowsPerPage + index + 1;
                        const title = getSubmissionTitle(row);
                        return (
                          <TableRow
                            key={row.id || row._id}
                            hover
                            sx={{ "& td": { borderBottom: `1px solid ${borderColor}` } }}
                          >
                            <TableCell sx={{ color: headingColor, fontWeight: 500 }}>
                              {slNo}
                            </TableCell>
                            <TableCell sx={{ color: headingColor, fontWeight: 500 }}>
                              {title}
                            </TableCell>
                            <TableCell sx={{ color: subColor }}>
                              {formatMonitoringDate(row.updatedAt || row.createdAt)}
                            </TableCell>
                            <TableCell align="right">
                              <IconButton
                                size="small"
                                aria-label="Form actions"
                                onClick={(e) => {
                                  setMenuAnchor(e.currentTarget);
                                  setMenuRow(row);
                                }}
                              >
                                <MoreHorizontal size={18} color={subColor} />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  component="div"
                  count={submissions.length}
                  page={page}
                  onPageChange={(_, nextPage) => setPage(nextPage)}
                  rowsPerPage={rowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRowsPerPage(parseInt(e.target.value, 10));
                    setPage(0);
                  }}
                  rowsPerPageOptions={ROWS_PER_PAGE_OPTIONS}
                  sx={{ borderTop: `1px solid ${borderColor}`, color: subColor }}
                />
              </>
            )}
          </Paper>
        )}
      </Box>

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={() => {
          setMenuAnchor(null);
          setMenuRow(null);
        }}
      >
        <MenuItem
          onClick={() => {
            openSubmission(menuRow, "view");
            setMenuAnchor(null);
            setMenuRow(null);
          }}
        >
          View
        </MenuItem>
        <MenuItem
          onClick={() => {
            openSubmission(menuRow, "edit");
            setMenuAnchor(null);
            setMenuRow(null);
          }}
        >
          Edit
        </MenuItem>
        <MenuItem
          onClick={() => {
            downloadSubmission(menuRow, "pdf");
            setMenuAnchor(null);
            setMenuRow(null);
          }}
        >
          Download as PDF
        </MenuItem>
        {isMonitoringCustomBuilderSubmission(menuRow) ? (
          <MenuItem
            onClick={() => {
              downloadSubmission(menuRow, "word");
              setMenuAnchor(null);
              setMenuRow(null);
            }}
          >
            Download as Word
          </MenuItem>
        ) : null}
        <MenuItem
          onClick={() => {
            setDeleteTarget(menuRow);
            setMenuAnchor(null);
            setMenuRow(null);
          }}
          sx={{ color: "#DC2626" }}
        >
          Delete
        </MenuItem>
      </Menu>

      <Dialog
        open={templateDialogOpen}
        onClose={closeTemplateDialog}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ fontWeight: 700, color: headingColor, pb: 1 }}>
          Select template / form
        </DialogTitle>
        <Box sx={{ px: 3, borderBottom: `1px solid ${borderColor}` }}>
          <Tabs
            value={templatePickerTab}
            onChange={(_, value) => setTemplatePickerTab(value)}
            sx={{
              minHeight: 40,
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 600,
                minHeight: 40,
                color: subColor,
              },
              "& .Mui-selected": { color: "#E89F17" },
              "& .MuiTabs-indicator": { bgcolor: "#E89F17" },
            }}
          >
            <Tab
              value={TEMPLATE_TAB_LIBRARY}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Template library
                  <Chip size="small" label={filteredTemplates.length} sx={{ height: 20, fontSize: "0.7rem" }} />
                </Box>
              }
            />
            <Tab
              value={TEMPLATE_TAB_SAVED}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Saved templates
                  <Chip size="small" label={filteredSavedSubmissions.length} sx={{ height: 20, fontSize: "0.7rem" }} />
                </Box>
              }
            />
            <Tab
              value={TEMPLATE_TAB_BUILDER}
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  Form builder
                  <Chip size="small" label={filteredBuilderForms.length} sx={{ height: 20, fontSize: "0.7rem" }} />
                </Box>
              }
            />
          </Tabs>
        </Box>
        <DialogContent dividers sx={{ maxHeight: "70vh" }}>
          <TextField
            fullWidth
            size="small"
            placeholder={
              templatePickerTab === TEMPLATE_TAB_SAVED
                ? "Search saved templates..."
                : templatePickerTab === TEMPLATE_TAB_BUILDER
                  ? "Search form builder forms..."
                  : "Search templates..."
            }
            value={templateSearch}
            onChange={(e) => setTemplateSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search size={18} color={subColor} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
            sx={{ mb: 2.5 }}
          />

          {pickerLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
              <CircularProgress sx={{ color: "#E89F17" }} />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              {templatePickerTab === TEMPLATE_TAB_LIBRARY &&
                (filteredTemplates.length === 0 ? (
                  <Typography sx={{ color: subColor, gridColumn: "1 / -1", py: 2, textAlign: "center" }}>
                    No templates match your search.
                  </Typography>
                ) : (
                  filteredTemplates.map((template) => (
                    <Card
                      key={template.id}
                      elevation={0}
                      sx={{
                        border: `1px solid ${borderColor}`,
                        borderRadius: 2,
                        bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                          <Box
                            sx={{
                              p: 1,
                              borderRadius: 1.5,
                              bgcolor: "rgba(232, 159, 23, 0.12)",
                              color: "#E89F17",
                              display: "flex",
                              flexShrink: 0,
                            }}
                          >
                            <FileText size={18} />
                          </Box>
                          <Box sx={{ minWidth: 0 }}>
                            {template.group ? (
                              <Typography
                                variant="caption"
                                sx={{ color: "#E89F17", fontWeight: 600, display: "block", mb: 0.25 }}
                              >
                                {template.group}
                              </Typography>
                            ) : null}
                            <Typography sx={{ fontWeight: 600, color: headingColor, fontSize: "0.9rem" }}>
                              {template.title}
                            </Typography>
                            <Typography variant="body2" sx={{ color: subColor, mt: 0.5 }}>
                              {template.description}
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: "flex", gap: 1 }}>
                          <Button
                            fullWidth
                            variant="outlined"
                            startIcon={<Eye size={16} />}
                            onClick={() => handlePreviewTemplate(template)}
                            sx={{ textTransform: "none", fontWeight: 600 }}
                          >
                            Preview
                          </Button>
                          <Button
                            fullWidth
                            variant="contained"
                            onClick={() => handleUseTemplate(template)}
                            sx={{
                              bgcolor: "#E89F17",
                              textTransform: "none",
                              fontWeight: 600,
                              "&:hover": { bgcolor: "#cc8b14" },
                            }}
                          >
                            Use
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  ))
                ))}

              {templatePickerTab === TEMPLATE_TAB_SAVED &&
                (filteredSavedSubmissions.length === 0 ? (
                  <Typography sx={{ color: subColor, gridColumn: "1 / -1", py: 2, textAlign: "center" }}>
                    No saved templates yet. Save a template from the Templates page to see it here.
                  </Typography>
                ) : (
                  filteredSavedSubmissions.map((submission) => {
                    const rid = submission.id || submission._id;
                    const primary =
                      submission.name ||
                      submission.answers?.name ||
                      submission.form?.title ||
                      "Untitled";
                    const secondary =
                      submission.answers?.templateModuleTitle ||
                      (submission.form?.title && primary !== submission.form.title
                        ? submission.form.title
                        : null);
                    const savedLabel = submission.createdAt
                      ? `Saved ${formatMonitoringDate(submission.createdAt)}`
                      : null;
                    return (
                      <Card
                        key={rid}
                        elevation={0}
                        sx={{
                          border: `1px solid ${borderColor}`,
                          borderRadius: 2,
                          bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "rgba(232, 159, 23, 0.12)",
                                color: "#E89F17",
                                display: "flex",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={18} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              {secondary ? (
                                <Typography
                                  variant="caption"
                                  sx={{ color: "#E89F17", fontWeight: 600, display: "block", mb: 0.25 }}
                                >
                                  {secondary}
                                </Typography>
                              ) : null}
                              <Typography sx={{ fontWeight: 600, color: headingColor, fontSize: "0.9rem" }}>
                                {primary}
                              </Typography>
                              {savedLabel ? (
                                <Typography variant="body2" sx={{ color: subColor, mt: 0.5 }}>
                                  {savedLabel}
                                </Typography>
                              ) : null}
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<Eye size={16} />}
                              onClick={() => handlePreviewSavedTemplate(submission)}
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              Preview
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleUseSavedTemplate(submission)}
                              sx={{
                                bgcolor: "#E89F17",
                                textTransform: "none",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#cc8b14" },
                              }}
                            >
                              Use
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                ))}

              {templatePickerTab === TEMPLATE_TAB_BUILDER &&
                (filteredBuilderForms.length === 0 ? (
                  <Typography sx={{ color: subColor, gridColumn: "1 / -1", py: 2, textAlign: "center" }}>
                    No form builder forms match your search. Create forms in the Form Builder first.
                  </Typography>
                ) : (
                  filteredBuilderForms.map((form) => {
                    const formId = form._id || form.id;
                    return (
                      <Card
                        key={formId}
                        elevation={0}
                        sx={{
                          border: `1px solid ${borderColor}`,
                          borderRadius: 2,
                          bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                        }}
                      >
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: "flex", gap: 1.5, mb: 1.5 }}>
                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                bgcolor: "rgba(232, 159, 23, 0.12)",
                                color: "#E89F17",
                                display: "flex",
                                flexShrink: 0,
                              }}
                            >
                              <FileText size={18} />
                            </Box>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 600, color: headingColor, fontSize: "0.9rem" }}>
                                {form.title || "Untitled form"}
                              </Typography>
                              {form.description ? (
                                <Typography variant="body2" sx={{ color: subColor, mt: 0.5 }}>
                                  {form.description}
                                </Typography>
                              ) : (
                                <Typography variant="body2" sx={{ color: subColor, mt: 0.5 }}>
                                  Custom form from the form builder
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          <Box sx={{ display: "flex", gap: 1 }}>
                            <Button
                              fullWidth
                              variant="outlined"
                              startIcon={<Eye size={16} />}
                              onClick={() => handlePreviewBuilderForm(form)}
                              sx={{ textTransform: "none", fontWeight: 600 }}
                            >
                              Preview
                            </Button>
                            <Button
                              fullWidth
                              variant="contained"
                              onClick={() => handleUseBuilderForm(form)}
                              sx={{
                                bgcolor: "#E89F17",
                                textTransform: "none",
                                fontWeight: 600,
                                "&:hover": { bgcolor: "#cc8b14" },
                              }}
                            >
                              Use
                            </Button>
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={closeTemplateDialog} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={folderDialogOpen} onClose={() => !creatingFolder && setFolderDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          {folderDialogMode === "edit" ? "Edit folder" : "Create folder"}
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            fullWidth
            label="Folder name"
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            disabled={creatingFolder}
            onKeyDown={(e) => {
              if (e.key === "Enter" && newFolderName.trim()) handleSaveFolder();
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFolderDialogOpen(false)} disabled={creatingFolder} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSaveFolder}
            disabled={creatingFolder || !newFolderName.trim()}
            sx={{
              bgcolor: "#E89F17",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { bgcolor: "#cc8b14" },
            }}
          >
            {creatingFolder
              ? folderDialogMode === "edit"
                ? "Saving…"
                : "Creating…"
              : folderDialogMode === "edit"
                ? "Save"
                : "Create"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={folderPickerOpen}
        onClose={() => setFolderPickerOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          Choose a folder
        </DialogTitle>
        <DialogContent dividers>
          <Typography sx={{ color: subColor, fontSize: "0.9rem", mb: 2 }}>
            Select which folder to add the template form to.
          </Typography>
          {folders.map((folder) => (
            <Button
              key={folder.id}
              fullWidth
              variant="outlined"
              startIcon={<Folder size={18} />}
              onClick={() => handlePickFolderForTemplate(folder.id)}
              sx={{
                justifyContent: "flex-start",
                textTransform: "none",
                fontWeight: 600,
                mb: 1,
                borderColor,
                color: headingColor,
              }}
            >
              {folder.name}
            </Button>
          ))}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setFolderPickerOpen(false)} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(folderDeleteTarget)}
        onClose={() => !deletingFolder && setFolderDeleteTarget(null)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          Delete folder?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: subColor }}>
            Delete &ldquo;{folderDeleteTarget?.name}&rdquo;? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => setFolderDeleteTarget(null)}
            disabled={deletingFolder}
            sx={{ textTransform: "none" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteFolder}
            disabled={deletingFolder}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {deletingFolder ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={formPanelOpen}
        onClose={closeFormPanel}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: "min(90vh, 900px)", borderRadius: 3, display: "flex", flexDirection: "column" } }}
      >
        <DialogTitle
          sx={{
            fontWeight: 700,
            color: headingColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            pr: 1,
          }}
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography component="span" sx={{ fontWeight: 700, fontSize: "1.1rem" }}>
              {formPanelTitle}
            </Typography>
            <Typography variant="body2" sx={{ color: subColor, mt: 0.25 }}>
              {formPanelMode === "view" ? "Read-only preview" : "Edit and save without leaving this folder"}
            </Typography>
          </Box>
          {formPanelMode === "view" && formPanelRow ? (
            <Button
              variant="outlined"
              size="small"
              startIcon={<Download size={16} />}
              onClick={() => downloadSubmission(formPanelRow, "pdf")}
              sx={{ textTransform: "none", fontWeight: 600, flexShrink: 0 }}
            >
              Download PDF
            </Button>
          ) : null}
        </DialogTitle>
        <DialogContent sx={{ p: 0, flex: 1, overflow: "hidden" }}>
          {formPanelUrl ? (
            <iframe
              src={formPanelUrl}
              title={formPanelTitle || "Form"}
              style={{ border: "none", width: "100%", height: "100%" }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${borderColor}` }}>
          <Button onClick={closeFormPanel} sx={{ textTransform: "none" }}>
            Close
          </Button>
          {formPanelMode === "view" && formPanelRow ? (
            <Button
              variant="contained"
              startIcon={<Download size={16} />}
              onClick={() => downloadSubmission(formPanelRow, "pdf")}
              sx={{
                bgcolor: "#E89F17",
                textTransform: "none",
                fontWeight: 600,
                "&:hover": { bgcolor: "#cc8b14" },
              }}
            >
              Download PDF
            </Button>
          ) : null}
        </DialogActions>
      </Dialog>

      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        fullWidth
        maxWidth="lg"
        PaperProps={{ sx: { height: "85vh", borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          Form preview
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: "100%", overflow: "hidden" }}>
          {previewUrl ? (
            <iframe
              src={previewUrl}
              title="Form preview"
              style={{ border: "none", width: "100%", height: "100%" }}
            />
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setPreviewOpen(false)} sx={{ textTransform: "none" }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(deleteTarget)} onClose={() => !deleting && setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 700, color: headingColor }}>
          Delete form?
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: subColor }}>
            This will permanently remove the saved form from this folder.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteTarget(null)} disabled={deleting} sx={{ textTransform: "none" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDelete}
            disabled={deleting}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            {deleting ? "Deleting…" : "Delete"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={5000}
        onClose={() => setSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={snack.severity}
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ width: "100%" }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
