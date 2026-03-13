import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    Paper,
    TextField,
    InputAdornment,
    CircularProgress,
    Grid,
    Card,
    CardContent,
    CardActionArea,
    Chip,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Stack,
    InputLabel,
    Menu,
    MenuItem,
    ListItemText
} from "@mui/material";

import { Building2, ClipboardList, FileText, DraftingCompass, BookOpen, Award, ShieldCheck, UploadCloud, Eye, Download, Trash2, X } from "lucide-react";
import SearchIcon from "@mui/icons-material/Search";
import LocationOnOutlinedIcon from '@mui/icons-material/LocationOnOutlined';
import CircleIcon from '@mui/icons-material/Circle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import LaunchOutlinedIcon from '@mui/icons-material/LaunchOutlined';
import AddIcon from '@mui/icons-material/Add';


import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined'; // RAMS
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined'; // Inductions
import DesignServicesOutlinedIcon from '@mui/icons-material/DesignServicesOutlined'; // Toolbox?
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined'; // Site Inspections?
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined'; // Accident
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined'; // Permits
import CollectionsOutlinedIcon from '@mui/icons-material/CollectionsOutlined'; // Drawings
import BookOutlinedIcon from '@mui/icons-material/BookOutlined'; // Site Diary
import AppRegistrationOutlinedIcon from '@mui/icons-material/AppRegistrationOutlined'; // Register
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined'; // Meeting Minutes
import PolicyOutlinedIcon from '@mui/icons-material/PolicyOutlined'; // Audit

import Layout from '../components/Layout';
import { fetchSites, uploadDocument, fetchDocuments, fetchDocumentCounts, deleteDocument } from "../services/api";
import { useTheme } from "../context/ThemeContext";
import { useSearchParams } from "react-router-dom";

const MODULES_CONFIG = [
    { title: "Friday Pack Forms", icon: <ClipboardList size={32} /> },
    { title: "RAMS", icon: <FileText size={32} /> },
    { title: "Drawings", icon: <DraftingCompass size={32} /> },
    { title: "Installation Manuals", icon: <BookOpen size={32} /> },
    { title: "Training Certificates", icon: <Award size={32} /> },
    { title: "Equipment Certificates", icon: <ShieldCheck size={32} /> },
    { title: "General Uploads", icon: <UploadCloud size={32} /> },
];

export default function SitepackManagement() {
    const { isDarkMode } = useTheme();
    // State
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const [selectedSite, setSelectedSite] = useState(null);
    const [selectedModule, setSelectedModule] = useState(null);
    const [modules, setModules] = useState(MODULES_CONFIG.map(m => ({ ...m, count: '0 documents', id: m.title })));

    // Document State
    const [docs, setDocs] = useState([]);

    // UI State
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [viewDocUrl, setViewDocUrl] = useState(null);
    const [viewDocType, setViewDocType] = useState(null);

    const [anchorEl, setAnchorEl] = useState(null);
    const [menuDoc, setMenuDoc] = useState(null);
    const [formData, setFormData] = useState({
        file: null, title: "", version: "", validFrom: "", validUntil: "", tags: ""
    });
    const [formErrors, setFormErrors] = useState({});

    // Load Sites
    useEffect(() => {
        const loadSites = async () => {
            setLoading(true);
            try {
                const data = await fetchSites(search);
                setSites(data.filter(site => site.isActive));
            } catch (error) {
                console.error("Error loading sites:", error);
            } finally {
                setLoading(false);
            }
        };
        loadSites();
    }, [search]);

    // Load Counts when site selected
    useEffect(() => {
        if (selectedSite) {
            const loadCounts = async () => {
                try {
                    const { counts } = await fetchDocumentCounts(selectedSite._id || selectedSite.id);
                    // Update modules with counts
                    setModules(prev => prev.map(m => ({
                        ...m,
                        count: `${counts[m.title] || 0} documents`
                    })));
                } catch (error) {
                    console.error("Error loading counts:", error);
                }
            };
            loadCounts();
        }
    }, [selectedSite]);

    // Load Documents when module selected
    useEffect(() => {
        if (selectedSite && selectedModule) {
            const loadDocs = async () => {
                try {
                    const { documents } = await fetchDocuments(selectedSite._id || selectedSite.id, selectedModule.title);
                    setDocs(documents || []);
                } catch (error) {
                    console.error("Error loading docs:", error);
                }
            };
            loadDocs();
        }
    }, [selectedSite, selectedModule]);

    // Handlers
    const handleSiteClick = (site) => {
        setSelectedSite(site);
        setSelectedModule(null);
    };

    const handleBackToSites = () => {
        if (selectedModule) {
            setSelectedModule(null);
        } else {
            setSelectedSite(null);
        }
    };

    const handleModuleClick = (module) => {
        setSelectedModule(module);
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setFormData({ ...formData, file: e.target.files[0] });
            setFormErrors({ ...formErrors, file: null });
        }
    };

    const handleInputChange = (field, value) => {
        setFormData({ ...formData, [field]: value });
        setFormErrors({ ...formErrors, [field]: null });
    };

    const [isUploading, setIsUploading] = useState(false);

    const handleCloseUploadModal = () => {
        setUploadModalOpen(false);
        setFormData({ file: null, title: "", version: "", validUntil: "", tags: "" });
        setFormErrors({});
    };

    const handleUpload = async () => {
        const errors = {};
        if (!formData.file) errors.file = "File is required";
        if (!formData.title) errors.title = "Title is required";
        if (!formData.version) errors.version = "Version is required";
        if (!formData.validUntil) errors.validUntil = "Valid Until is required";
        if (!formData.tags) errors.tags = "Tags are required";

        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setIsUploading(true);
        try {
            const uploadData = new FormData();
            uploadData.append('file', formData.file);
            uploadData.append('title', formData.title);
            uploadData.append('version', formData.version);
            uploadData.append('validUntil', formData.validUntil);
            uploadData.append('tags', formData.tags);
            uploadData.append('siteId', selectedSite._id || selectedSite.id);
            uploadData.append('category', selectedModule.title);

            await uploadDocument(uploadData);
            handleCloseUploadModal();
            // Refresh docs
            const { documents } = await fetchDocuments(selectedSite._id || selectedSite.id, selectedModule.title);
            setDocs(documents || []);
        } catch (error) {
            console.error("Upload failed", error);
            // Handle error UI if needed
        } finally {
            setIsUploading(false);
        }
    };

    const handleMenuClick = (event, doc) => {
        setAnchorEl(event.currentTarget);
        setMenuDoc(doc);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuDoc(null);
    };

    const openMenu = Boolean(anchorEl);

    const handleView = () => {
        if (menuDoc?.url) {
            setViewDocUrl(menuDoc.url);
            setViewDocType(menuDoc.type || 'UNKNOWN');
            setViewModalOpen(true);
        }
        handleMenuClose();
    };

    const handleCloseViewModal = () => {
        setViewModalOpen(false);
        setViewDocUrl(null);
        setViewDocType(null);
    };

    const handleDownload = () => {
        if (menuDoc?.url) {
            window.open(menuDoc.url, '_blank');
        }
        handleMenuClose();
    };

    const handleDeleteClick = () => {
        setDeleteModalOpen(true);
        setAnchorEl(null); // Close menu but keep menuDoc for delete dialog
    };

    const confirmDelete = async () => {
        if (menuDoc) {
            try {
                await deleteDocument(menuDoc._id || menuDoc.id);
                setDeleteModalOpen(false);
                setMenuDoc(null);
                // Refresh docs
                const { documents } = await fetchDocuments(selectedSite._id || selectedSite.id, selectedModule.title);
                setDocs(documents || []);
            } catch (error) {
                console.error("Delete failed", error);
            }
        }
    };

    const filteredDocs = docs;

    return (
        <Layout pageTitle={selectedSite ? selectedSite.name : "Site Pack Management"}>
            {/* Header Section */}
            <Box sx={{ mb: 4, display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {selectedSite && (
                        <Box
                            onClick={handleBackToSites}
                            sx={{
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' }
                            }}
                        >
                            <ArrowBackIcon />
                        </Box>
                    )}
                    <Box>
                        <Typography variant="h5" fontWeight={600} gutterBottom sx={{ mb: 0 }}>
                            {selectedModule ? selectedModule.title : (selectedSite ? selectedSite.name : "All Sites")}
                        </Typography>
                        {!selectedSite && !selectedModule && (
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                Select a site to manage its document packs
                            </Typography>
                        )}
                        {selectedSite && !selectedModule && (
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                Select a module to manage documents
                            </Typography>
                        )}
                        {selectedModule && (
                            <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
                                {selectedSite.name}
                            </Typography>
                        )}
                        {selectedModule && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                                {filteredDocs.length} documents
                            </Typography>
                        )}

                    </Box>
                </Box>

                {selectedModule && (
                    <Button
                        variant="contained"
                        startIcon={<FileUploadOutlinedIcon />}
                        onClick={() => setUploadModalOpen(true)}
                        sx={{
                            bgcolor: '#FF8D00',
                            '&:hover': { bgcolor: '#FF8D00' },
                            textTransform: 'none',
                            fontWeight: 500,
                            borderRadius: 2,

                        }}
                    >
                        Upload
                    </Button>
                )}
            </Box>

            {/* Main Content Grid (Site List or Documents) */}
            {
                selectedSite ? (
                    selectedModule ? (
                        // DOCUMENT VIEW
                        <>

                            <Grid container spacing={3}>
                                {filteredDocs.map((doc) => {
                                    let icon = <DescriptionOutlinedIcon sx={{ fontSize: 32 }} />;
                                    let color = '#6B7280';
                                    let bgcolor = '#F3F4F6';

                                    const type = doc.type ? doc.type.toUpperCase() : '';

                                    if (type === 'PDF') {
                                        icon = <PictureAsPdfIcon sx={{ fontSize: 32 }} />;
                                        color = '#EF4444'; // Red
                                        bgcolor = '#FEF2F2';
                                    } else if (['DOC', 'DOCX'].includes(type)) {
                                        icon = <DescriptionOutlinedIcon sx={{ fontSize: 32 }} />;
                                        color = '#3B82F6'; // Blue
                                        bgcolor = '#EFF6FF';
                                    } else if (['XLS', 'XLSX', 'CSV'].includes(type)) {
                                        icon = <DescriptionOutlinedIcon sx={{ fontSize: 32 }} />;
                                        color = '#10B981'; // Green
                                        bgcolor = '#ECFDF5';
                                    } else if (['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(type)) {
                                        icon = <ImageOutlinedIcon sx={{ fontSize: 32 }} />;
                                        color = '#8B5CF6'; // Violet
                                        bgcolor = '#F5F3FF';
                                    } else if (type === 'MP4') {
                                        icon = <ImageOutlinedIcon sx={{ fontSize: 32 }} />;
                                        color = '#D946EF'; // Fuchsia
                                        bgcolor = '#FAE8FF';
                                    } else if (type === 'TXT') {
                                        icon = <DescriptionOutlinedIcon sx={{ fontSize: 32 }} />;
                                        color = '#6B7280'; // Gray
                                        bgcolor = '#F3F4F6';
                                    }

                                    return (
                                        <Grid item key={doc.id || doc._id}>
                                            <Card
                                                variant="outlined"
                                                sx={{
                                                    borderRadius: 4,
                                                    height: '100%',
                                                    width: 350,
                                                    bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
                                                    borderColor: isDarkMode ? "#374151" : "#E5E7EB",
                                                    transition: 'all 0.2s',
                                                    '&:hover': { boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : 2, borderColor: color },
                                                    position: 'relative'
                                                }}
                                            >
                                                <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                                                    <IconButton
                                                        size="small"
                                                        onClick={(e) => handleMenuClick(e, doc)}
                                                        sx={{ color: 'text.secondary' }}
                                                    >
                                                        <MoreVertIcon />
                                                    </IconButton>
                                                </Box>

                                                <CardContent sx={{ display: 'flex', gap: 3, alignItems: 'center' }}>
                                                    <Box
                                                        sx={{
                                                            minWidth: 56,
                                                            height: 56,
                                                            bgcolor: bgcolor,
                                                            color: color,
                                                            borderRadius: 3,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center'
                                                        }}
                                                    >
                                                        {icon}
                                                    </Box>
                                                    <Box sx={{ flex: 1 }}>
                                                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                            <Typography variant="subtitle1" fontWeight={600} sx={{ lineHeight: 1.2, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                                                                {doc.title}
                                                            </Typography>
                                                        </Box>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                            <Chip label={doc.type || 'FILE'} size="small" sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : bgcolor, color: color, fontWeight: 700, borderRadius: 1, height: 20, fontSize: '0.7rem' }} />
                                                            <Typography variant="caption" sx={{ color: isDarkMode ? "#9CA3AF" : "text.secondary" }}>
                                                                {doc.version}
                                                            </Typography>
                                                        </Box>
                                                        <Typography variant="body2" sx={{ mb: 1.5, color: isDarkMode ? "#9CA3AF" : "text.secondary" }}>
                                                            {doc.size} &bull; {doc.createdAt ? new Date(doc.createdAt).toISOString().split('T')[0] : 'N/A'}
                                                        </Typography>
                                                        {(doc.validFrom && doc.validUntil) && (
                                                            <Chip
                                                                label={`Valid: ${doc.validFrom} — ${doc.validUntil}`}
                                                                size="small"
                                                                sx={{
                                                                    bgcolor: isDarkMode ? "rgba(251, 146, 60, 0.1)" : '#FFF7ED',
                                                                    color: isDarkMode ? '#FB923C' : '#F97316',
                                                                    borderRadius: 1,
                                                                    fontSize: '0.75rem'
                                                                }}
                                                            />
                                                        )}
                                                    </Box>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    );
                                })}
                            </Grid>
                        </>
                    ) : (
                        // MODULE SELECTION VIEW
                        <Grid container spacing={2}>
                            {modules.map((module) => (
                                <Grid item xs={6} sm={6} md={6} lg={6} xl={6} key={module.title} sx={{ minWidth: 0 }}>
                                    <Card
                                        variant="outlined"
                                        onClick={() => handleModuleClick(module)}
                                        sx={{
                                            borderRadius: 4,
                                            width: 300,
                                            height: 100,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                                            border: isDarkMode ? "1px solid #374151" : '1px solid #E5E7EB',
                                            transition: 'all 0.2s ease-in-out',
                                            cursor: 'pointer',
                                            "&:hover": {
                                                borderColor: isDarkMode ? "#3B82F6" : "#3B82F6", // Blue hover
                                                boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)"
                                            }
                                        }}
                                    >
                                        <CardActionArea sx={{ flex: 1, p: 2, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                                                <Box
                                                    sx={{
                                                        bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : '#EFF6FF', // Blue 50
                                                        p: 1.5,
                                                        borderRadius: 3,
                                                        color: '#3B82F6', // Blue 500
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        minWidth: 48,
                                                        height: 48
                                                    }}
                                                >
                                                    {React.cloneElement(module.icon, { size: 24 })}
                                                </Box>
                                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                                    <Typography variant="subtitle1" fontWeight={700} noWrap sx={{ fontSize: '0.95rem', mb: 0.5, color: isDarkMode ? "#F9FAFB" : "#111827", lineHeight: 1.2 }}>
                                                        {module.title}
                                                    </Typography>
                                                    <Box sx={{
                                                        display: 'inline-flex',
                                                        px: 1,
                                                        py: 0.25,
                                                        borderRadius: 10,
                                                        bgcolor: '#DFA036', // Light Orange
                                                        color: '#FFFFFF'
                                                    }}>
                                                        <Typography variant="caption" fontWeight={600} sx={{ fontSize: '0.7rem', lineHeight: 1 }}>
                                                            {module.count}
                                                        </Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            ))}
                        </Grid>
                    )
                ) : (
                    // SITE LIST VIEW
                    loading ? (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                            <CircularProgress />
                        </Box>
                    ) : (
                        <Grid container spacing={3}>
                            {sites.length === 0 ? (
                                <Grid item xs={12}>
                                    <Typography color="text.secondary" align="center">
                                        No sites found.
                                    </Typography>
                                </Grid>
                            ) : (
                                sites.map((site) => (
                                    <Grid item xs={12} sm={6} md={4} key={site.id || site._id}>
                                        <Card
                                            variant="outlined"
                                            onClick={() => handleSiteClick(site)}
                                            sx={{
                                                borderRadius: 4,
                                                width: 350,
                                                height: 150,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                bgcolor: isDarkMode ? "#111827" : "#FFFFFF",
                                                border: isDarkMode ? "1px solid #374151" : '1px solid #E5E7EB',
                                                transition: 'all 0.2s ease-in-out',
                                                cursor: 'pointer',
                                                "&:hover": {
                                                    borderColor: "#3B82F6",
                                                    boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 6px -1px rgba(59, 130, 246, 0.1), 0 2px 4px -1px rgba(59, 130, 246, 0.06)"
                                                }
                                            }}
                                        >
                                            <CardActionArea sx={{ height: '100%', p: 3, display: 'flex', justifyContent: 'flex-start', alignItems: 'flex-start' }}>
                                                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, width: '100%' }}>
                                                    {/* Icon Box */}
                                                    <Box
                                                        sx={{
                                                            bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : '#EFF6FF', // Blue 50
                                                            p: 1.5,
                                                            borderRadius: 3,
                                                            color: '#3B82F6', // Blue 500
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            justifyContent: 'center',
                                                            minWidth: 56,
                                                            height: 56
                                                        }}
                                                    >
                                                        <Building2 size={28} />
                                                    </Box>

                                                    {/* Content */}
                                                    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                                                        <Typography variant="h6" fontWeight={700} sx={{ fontSize: '1.1rem', mb: 0.5, color: isDarkMode ? "#F9FAFB" : "#111827", lineHeight: 1.3 }}>
                                                            {site.name}
                                                        </Typography>

                                                        {site.address && (
                                                            <Typography variant="body2" sx={{ color: isDarkMode ? "#9CA3AF" : "#6B7280", lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                                                {site.address}
                                                            </Typography>
                                                        )}
                                                    </Box>
                                                </Box>
                                            </CardActionArea>
                                        </Card>
                                    </Grid>
                                ))
                            )
                            }
                        </Grid >
                    )
                )
            }

            {/* Upload Modal */}
            <Dialog
                open={uploadModalOpen}
                onClose={handleCloseUploadModal}
                maxWidth="sm"
                fullWidth
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                        overflow: 'visible',
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF"
                    }
                }}
            >
                <DialogTitle sx={{
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 1.5,
                    pt: 3,
                    px: 3,
                    pb: 1,
                    borderBottom: isDarkMode ? "1px solid #374151" : "1px solid #E5E7EB",
                    bgcolor: isDarkMode ? "#1B212C" : "#F4F3F1", // Light Mode Header BG
                    borderTopLeftRadius: 12,
                    borderTopRightRadius: 12
                }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{
                            p: 1,
                            borderRadius: '50%',
                            bgcolor: isDarkMode ? 'rgba(96, 165, 250, 0.2)' : '#E0F2FE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <UploadCloud size={20} color={isDarkMode ? "#60A5FA" : "#0B4DA6"} />
                        </Box>
                        <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1.125rem', color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                            Upload Document
                        </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleCloseUploadModal}>
                        <Trash2 size={18} color="#9CA3AF" />
                    </IconButton>
                </DialogTitle>

                <DialogContent sx={{ p: 4, bgcolor: isDarkMode ? "#111827" : "#FFFFFF" }}>
                    <Stack spacing={3}>
                        {/* Drop Zone */}
                        <Box
                            sx={{
                                position: 'relative',
                                border: '2px dashed',
                                borderColor: formErrors.file ? 'error.main' : (isDarkMode ? '#374151' : '#E5E7EB'),
                                borderRadius: 4,
                                p: 4,
                                textAlign: 'center',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                bgcolor: isDarkMode ? 'rgba(255,255,255,0.02)' : '#F9FAFB',
                                '&:hover': {
                                    borderColor: '#F97316', // Orange hover
                                    bgcolor: isDarkMode ? 'rgba(249, 115, 22, 0.05)' : '#FFF7ED'
                                }
                            }}
                        >
                            <input
                                type="file"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    opacity: 0,
                                    cursor: 'pointer'
                                }}
                                onChange={handleFileChange}
                                accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.mp4,.txt"
                            />
                            {formData.file && formData.file.type === "application/pdf" ? (
                                <Box sx={{ mt: 1, mb: 2, height: 180, width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid #e5e7eb', zIndex: 1, position: 'relative' }}>
                                    <iframe 
                                        src={URL.createObjectURL(formData.file)} 
                                        width="100%" 
                                        height="100%" 
                                        style={{ border: 'none', pointerEvents: 'none' }}
                                        title="PDF Preview"
                                    />
                                </Box>
                            ) : formData.file && formData.file.type.startsWith("image/") ? (
                                <Box sx={{ mt: 1, mb: 2, height: 180, width: '100%', display: 'flex', justifyContent: 'center', zIndex: 1, position: 'relative' }}>
                                    <img src={URL.createObjectURL(formData.file)} alt="Preview" style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', borderRadius: 8 }} />
                                </Box>
                            ) : (
                                <Box sx={{ color: 'text.secondary', mb: 1.5, display: 'flex', justifyContent: 'center' }}>
                                    <FileUploadOutlinedIcon sx={{ fontSize: 40, color: 'text.secondary', opacity: 0.7 }} />
                                </Box>
                            )}

                            <Typography variant="subtitle2" fontWeight={500} gutterBottom sx={{ position: 'relative', zIndex: 1 }}>
                                {formData.file ? formData.file.name : "Drop files here or click to upload"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ position: 'relative', zIndex: 1 }}>
                                {formData.file ? `${(formData.file.size / 1024 / 1024).toFixed(2)} MB` : "PDF, DOC, XLS, JPG, PNG, MP4, TXT up to 50 MB"}
                            </Typography>
                            {formErrors.file && (
                                <Typography variant="caption" color="error" display="block" sx={{ mt: 1, position: 'relative', zIndex: 1 }}>
                                    {formErrors.file}
                                </Typography>
                            )}
                        </Box>

                        {/* Form Fields */}
                        <Stack spacing={2.5}>
                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: '0.85rem', fontWeight: 500, color: isDarkMode ? '#D1D5DB' : '#374151', ml: 1 }}>Document Title</InputLabel>
                                <TextField
                                    placeholder="Enter document title"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.title}
                                    onChange={(e) => handleInputChange('title', e.target.value)}
                                    error={!!formErrors.title}
                                    helperText={formErrors.title}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 50,
                                            bgcolor: isDarkMode ? "#1F2937" : "#F3F4F6",
                                            "& fieldset": { border: 'none' },
                                            "&.Mui-focused fieldset": { border: '1px solid #F97316' }, // Orange focus
                                            pl: 2
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <InputLabel sx={{ mb: 0.5, fontSize: '0.85rem', fontWeight: 500, color: isDarkMode ? '#D1D5DB' : '#374151', ml: 1 }}>Version</InputLabel>
                                <TextField
                                    placeholder="e.g. v1.0"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.version}
                                    onChange={(e) => handleInputChange('version', e.target.value)}
                                    error={!!formErrors.version}
                                    helperText={formErrors.version}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 50,
                                            bgcolor: isDarkMode ? "#1F2937" : "#F3F4F6",
                                            "& fieldset": { border: 'none' },
                                            "&.Mui-focused fieldset": { border: '1px solid #F97316' },
                                            pl: 2
                                        }
                                    }}
                                />
                            </Box>

                            <Box sx={{ width: '100%' }}>
                                <InputLabel sx={{ mb: 0.5, fontSize: '0.85rem', fontWeight: 500, color: isDarkMode ? '#D1D5DB' : '#374151', ml: 1 }}>Valid Until</InputLabel>
                                <TextField
                                    type="date"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.validUntil}
                                    onChange={(e) => handleInputChange('validUntil', e.target.value)}
                                    error={!!formErrors.validUntil}
                                    helperText={formErrors.validUntil}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 50,
                                            bgcolor: isDarkMode ? "#1F2937" : "#F3F4F6",
                                            "& fieldset": { border: 'none' },
                                            "&.Mui-focused fieldset": { border: '1px solid #F97316' },
                                            pl: 2
                                        }
                                    }}
                                />
                            </Box>

                            <Box>
                                <InputLabel sx={{ mb: 0.5, fontSize: '0.85rem', fontWeight: 500, color: isDarkMode ? '#D1D5DB' : '#374151', ml: 1 }}>Tags</InputLabel>
                                <TextField
                                    placeholder="Enter tags separated by commas"
                                    fullWidth
                                    variant="outlined"
                                    size="small"
                                    value={formData.tags}
                                    onChange={(e) => handleInputChange('tags', e.target.value)}
                                    error={!!formErrors.tags}
                                    helperText={formErrors.tags}
                                    sx={{
                                        "& .MuiOutlinedInput-root": {
                                            borderRadius: 50,
                                            bgcolor: isDarkMode ? "#1F2937" : "#F3F4F6",
                                            "& fieldset": { border: 'none' },
                                            "&.Mui-focused fieldset": { border: '1px solid #F97316' },
                                            pl: 2
                                        }
                                    }}
                                />
                            </Box>
                        </Stack>
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 4, pt: 1, justifyContent: 'flex-end', gap: 1 }}>
                    <Button
                        onClick={handleCloseUploadModal}
                        variant="text"
                        sx={{
                            color: isDarkMode ? '#9CA3AF' : '#6B7281',
                            textTransform: 'none',
                            fontWeight: 600,
                            mr: 1
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        onClick={handleUpload}
                        startIcon={isUploading ? <CircularProgress size={20} color="inherit" /> : <UploadCloud size={18} />}
                        disabled={isUploading}
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            fontWeight: 600,
                            bgcolor: '#F97316', // Orange 500
                            borderRadius: 50,
                            px: 4,
                            py: 1,
                            '&:hover': { bgcolor: '#EA580C' }
                        }}
                    >
                        {isUploading ? "Uploading..." : "Upload Document"}
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Action Menu */}
            <Menu
                anchorEl={anchorEl}
                open={openMenu}
                onClose={handleMenuClose}
                PaperProps={{
                    elevation: 1,
                    sx: {
                        borderRadius: 2,
                        minWidth: 150,
                        border: '1px solid #E5E7EB',
                        marginTop: 1
                    }
                }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            >
                <MenuItem onClick={handleView} sx={{ gap: 1.5, py: 1.5 }}>
                    <Eye size={18} color="#6B7280" />
                    <ListItemText primary="View" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem onClick={handleDownload} sx={{ gap: 1.5, py: 1.5 }}>
                    <Download size={18} color="#6B7280" />
                    <ListItemText primary="Download" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                </MenuItem>
                <MenuItem onClick={handleDeleteClick} sx={{ gap: 1.5, py: 1.5, color: '#EF4444' }}>
                    <Trash2 size={18} color="currentColor" />
                    <ListItemText primary="Delete" primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }} />
                </MenuItem>
            </Menu>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                PaperProps={{
                    sx: {
                        borderRadius: 3,
                        padding: 2,
                        minWidth: 320,
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
                        color: isDarkMode ? "#F9FAFB" : "inherit"
                    }
                }}
            >
                <DialogTitle sx={{ pb: 1, fontWeight: 600, fontSize: '1.25rem' }}>
                    Delete Document?
                </DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2, color: isDarkMode ? "#9CA3AF" : "text.secondary" }}>
                        Are you sure you want to delete <b>{menuDoc?.title}</b>? This action cannot be undone.
                    </Typography>
                </DialogContent>
                <DialogActions sx={{ borderTop: isDarkMode ? "1px solid #374151" : "none", pt: 2 }}>
                    <Button
                        onClick={() => setDeleteModalOpen(false)}
                        variant="outlined"
                        sx={{
                            textTransform: 'none',
                            color: isDarkMode ? "#9CA3AF" : 'text.primary',
                            borderColor: isDarkMode ? "#374151" : 'divider',
                            borderRadius: 50,
                            px: 3
                        }}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={confirmDelete}
                        variant="contained"
                        color="error"
                        disableElevation
                        sx={{
                            textTransform: 'none',
                            borderRadius: 50,
                            px: 3,
                            bgcolor: "#EF4444"
                        }}
                    >
                        Delete
                    </Button>
                </DialogActions>
            </Dialog>

            {/* View Document Modal */}
            <Dialog
                open={viewModalOpen}
                onClose={handleCloseViewModal}
                maxWidth="lg"
                fullWidth
                PaperProps={{
                    sx: {
                        height: '85vh',
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF",
                        borderRadius: 3,
                    }
                }}
            >
                <DialogTitle sx={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    borderBottom: isDarkMode ? '1px solid #374151' : '1px solid #E5E7EB',
                    p: 2, 
                    px: 3 
                }}>
                    <Typography variant="h6" fontWeight={600}>Document Viewer</Typography>
                    <IconButton size="small" onClick={handleCloseViewModal}>
                        <X size={20} color={isDarkMode ? "#9CA3AF" : "#6B7280"} />
                    </IconButton>
                </DialogTitle>
                <DialogContent sx={{ p: 0, height: '100%', overflow: 'hidden', bgcolor: isDarkMode ? "#111827" : "#F3F4F6", display: 'flex', justifyContent: 'center' }}>
                    {viewDocType === 'PDF' && (
                        <iframe 
                            src={viewDocUrl}
                            width="100%"
                            height="100%"
                            style={{ border: 'none' }}
                            title="Document Viewer"
                        />
                    )}
                    {['JPG', 'JPEG', 'PNG', 'WEBP', 'SVG'].includes(viewDocType) && (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                            <img src={viewDocUrl} alt="Document" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                        </Box>
                    )}
                    {viewDocType === 'MP4' && (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                            <video src={viewDocUrl} controls style={{ maxWidth: '100%', maxHeight: '100%' }} />
                        </Box>
                    )}
                    {!['PDF', 'JPG', 'JPEG', 'PNG', 'WEBP', 'SVG', 'MP4'].includes(viewDocType) && (
                        <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', p: 3 }}>
                            <FileText size={48} color={isDarkMode ? "#9CA3AF" : "#6B7280"} style={{ marginBottom: 16 }} />
                            <Typography variant="h6" gutterBottom color={isDarkMode ? "#F9FAFB" : "#111827"}>Preview not available</Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                This file type ({viewDocType}) cannot be previewed directly in the browser.
                            </Typography>
                            <Button 
                                variant="contained" 
                                href={viewDocUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                startIcon={<Download size={18} />}
                                sx={{ textTransform: 'none', borderRadius: 2 }}
                            >
                                Download File
                            </Button>
                        </Box>
                    )}
                </DialogContent>
            </Dialog>
        </Layout >
    );
}
