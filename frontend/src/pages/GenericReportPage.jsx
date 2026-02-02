import React, { useState, useEffect, useRef, useCallback } from "react";
import {
    Box,
    Typography,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Chip,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    IconButton,
    Menu,
    MenuItem,
    ListItemIcon,
    ListItemText,
    TextField
} from "@mui/material";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import DownloadIcon from "@mui/icons-material/Download";
import EmailIcon from "@mui/icons-material/Email";
import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import FormSelectionDialog from "../components/FormSelectionDialog";
import FormRenderer from "../components/FormRenderer";
import api from "../services/api";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

// helper to build absolute URL for logos
const computeLogoUrl = (logo) => {
    if (!logo) return null;
    if (/^https?:\/\//i.test(logo)) return logo;
    const host = "https://safetynet-tech-7qme.vercel.app";
    return `${host.replace(/\/$/, "")}${logo.startsWith("/") ? "" : "/"}${logo}`;
};

export default function GenericReportPage({ pageTitle }) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedForm, setSelectedForm] = useState(null);
    const [formValues, setFormValues] = useState({});
    const [logoUrl, setLogoUrl] = useState(null);

    useEffect(() => {
        try {
            const userStr = localStorage.getItem("user");
            if (userStr) {
                const user = JSON.parse(userStr);
                let rawLogo = null;
                // Check if clientId is an object (populated) or just ID
                if (user.clientId && typeof user.clientId === 'object' && user.clientId.logo) {
                    rawLogo = user.clientId.logo;
                } else if (user.companyLogo) {
                    rawLogo = user.companyLogo;
                } else if (user.logo) {
                    rawLogo = user.logo;
                }

                if (rawLogo) {
                    setLogoUrl(computeLogoUrl(rawLogo));
                }
            }
        } catch (e) {
            console.error("Error parsing user from localstorage", e);
        }
    }, []);

    // Modes: 
    // - initial: List view
    // - filling: New submission
    // - editing: Editing existing submission
    // - viewed: Read-only view
    const [viewMode, setViewMode] = useState("initial");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Submissions list state
    const [submissions, setSubmissions] = useState([]);


    // Success Dialog state
    const [successOpen, setSuccessOpen] = useState(false);
    const [lastResponse, setLastResponse] = useState(null);

    // Delete Dialog
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    // Menu State
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuItem, setMenuItem] = useState(null);

    // Edit State
    const [editingId, setEditingId] = useState(null);

    // PDF Ref
    const printRef = useRef();

    // Email State
    const [emailDialogOpen, setEmailDialogOpen] = useState(false);
    const [recipientEmail, setRecipientEmail] = useState("");
    const [emailingItem, setEmailingItem] = useState(null);


    const fetchSubmissions = useCallback(async () => {
        try {
            const res = await api.get("/forms/responses", {
                params: { category: pageTitle }
            });
            if (res.data?.success) {
                setSubmissions(res.data.data);
            }
        } catch (err) {
            console.error("Failed to fetch submissions", err);
        }
    }, [pageTitle]);

    // Reset state when title changes (e.g. navigating between sidebar items)
    useEffect(() => {
        setViewMode("initial");
        setSelectedForm(null);
        setFormValues({});
        fetchSubmissions();
    }, [pageTitle, fetchSubmissions]);

    const handleSelectForm = (form) => {
        setSelectedForm(form);
        setFormValues({});
        setEditingId(null);
        setViewMode("filling");
        setDialogOpen(false);
    };

    const handleFormChange = (fieldId, value) => {
        setFormValues((prev) => ({ ...prev, [fieldId]: value }));
    };

    const handleSubmit = async () => {
        if (!selectedForm) return;

        setIsSubmitting(true);
        try {
            let res;
            if (viewMode === "editing" && editingId) {
                // Update existing
                res = await api.put(`/forms/responses/${editingId}`, {
                    answers: formValues
                });
            } else {
                // Create new
                res = await api.post(`/forms/${selectedForm._id}/responses`, {
                    formId: selectedForm._id,
                    answers: formValues,
                    category: pageTitle
                });
            }

            if (res.data?.success) {
                const newSub = res.data.data;
                const displaySub = viewMode === "editing" ? { ...newSub, formId: selectedForm } : { ...newSub, formId: selectedForm, answers: formValues };

                setLastResponse({
                    ...displaySub,
                    answers: formValues // Ensure we have latest values
                });

                setSuccessOpen(true);
                fetchSubmissions();
            }
        } catch (err) {
            console.error("Submission failed", err);
            alert("Failed to save form. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleSuccessClose = () => {
        setSuccessOpen(false);
        if (lastResponse) {
            setEditingId(null);
            setSelectedForm(lastResponse.formId);
            setFormValues(lastResponse.answers);
            setViewMode("viewed");
            setLastResponse(null);
        } else {
            setViewMode("initial");
        }
    };

    const handleMenuClick = (event, item) => {
        setAnchorEl(event.currentTarget);
        setMenuItem(item);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setMenuItem(null);
    };

    const handleAction = (action) => {
        if (!menuItem) return;
        const item = menuItem;
        handleMenuClose();

        switch (action) {
            case "view":
                openSubmissionView(item, "viewed");
                break;
            case "edit":
                openSubmissionView(item, "editing");
                break;
            case "delete":
                setItemToDelete(item);
                setDeleteConfirmOpen(true);
                break;
            case "download":
                // Open and then download
                openSubmissionView(item, "viewed");
                setTimeout(() => {
                    alert("Please click the 'Download PDF' button in the viewer.");
                }, 500);
                break;
            case "email":
                setEmailingItem(item);
                setEmailDialogOpen(true);
                break;
            default:
                break;
        }
    };

    const openSubmissionView = async (sub, mode) => {
        try {
            const formId = sub.formId._id || sub.formId;
            const formRes = await api.get(`/forms/${formId}`);
            if (formRes.data?.success) {
                setSelectedForm(formRes.data.data);
                setFormValues(sub.answers || {});
                setEditingId(sub._id);
                setViewMode(mode);
            }
        } catch (e) {
            console.error("Could not load form definition", e);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/forms/responses/${itemToDelete._id}`);
            fetchSubmissions();
            setDeleteConfirmOpen(false);
            setItemToDelete(null);
        } catch (e) {
            console.error(e);
            alert("Failed to delete");
        }
    };

    const handleDownloadPdf = async () => {
        if (printRef.current) {
            try {
                // Use CORS to ensure external images (like logo) are captured
                const canvas = await html2canvas(printRef.current, {
                    useCORS: true,
                    scale: 2, // Improve quality
                    allowTaint: true,
                    logging: true,
                    // If your logo is on a different domain, make sure backend sends CORS headers for image
                    // or handle proxy. But standard CORS usually works with useCORS: true
                });
                const imgData = canvas.toDataURL("image/png");
                const pdf = new jsPDF("p", "mm", "a4");
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
                pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
                pdf.save(`report-${selectedForm?.title || "download"}.pdf`);
            } catch (err) {
                console.error("PDF generation failed", err);
                alert("Could not generate PDF. Please try again.");
            }
        }
    };

    const handleEmailSend = async () => {
        if (!recipientEmail || !emailingItem) return;
        try {
            const res = await api.post(`/forms/responses/${emailingItem._id}/email`, { email: recipientEmail });
            if (res.data?.success) {
                alert("Email sent successfully!");
                setEmailDialogOpen(false);
                setRecipientEmail("");
                setEmailingItem(null);
            }
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.error || e.response?.data?.message || "Failed to send email";
            alert(`Error: ${msg}`);
        }
    };

    return (
        <>
            <TopNav />
            <Box sx={{ display: "flex", bgcolor: "#f9fafb", minHeight: "100vh" }}>
                <Box component="aside" sx={{ width: { xs: 0, md: 260 }, bgcolor: "#fff", borderRight: "1px solid #e5e7eb" }}>
                    <Sidebar />
                </Box>

                <Box component="main" sx={{ flex: 1, px: 4, py: 4, height: "100vh", overflowY: "auto" }}>
                    <Box sx={{ maxWidth: 1000, mx: "auto" }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 4 }}>
                            <Typography variant="h4" fontWeight={700}>{pageTitle}</Typography>
                            {(viewMode !== "initial") && (
                                <Box sx={{ display: 'flex', gap: 2 }}>
                                    {viewMode === "viewed" && (
                                        <Button startIcon={<DownloadIcon />} variant="contained" onClick={handleDownloadPdf}>
                                            Download PDF
                                        </Button>
                                    )}
                                    <Button variant="outlined" onClick={() => setViewMode("initial")}>Back to List</Button>
                                </Box>
                            )}
                            {viewMode === "initial" && (
                                <Box sx={{ display: "flex", gap: 2 }}>
                                    <Button variant="contained" onClick={() => setDialogOpen(true)}>Choose Form</Button>
                                </Box>
                            )}
                        </Box>

                        {viewMode === "initial" && (
                            <Paper sx={{ width: '100%', mb: 2 }}>
                                <TableContainer>
                                    <Table>
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Form Name</TableCell>
                                                <TableCell>Date</TableCell>
                                                <TableCell>Status</TableCell>
                                                <TableCell align="right">Actions</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {submissions.map((row) => (
                                                <TableRow key={row._id}>
                                                    <TableCell>{row.formId?.title || "Untitled"}</TableCell>
                                                    <TableCell>{new Date(row.createdAt).toLocaleDateString()}</TableCell>
                                                    <TableCell><Chip label="Submitted" color="success" size="small" variant="outlined" /></TableCell>
                                                    <TableCell align="right">
                                                        <IconButton onClick={(e) => handleMenuClick(e, row)}>
                                                            <MoreVertIcon />
                                                        </IconButton>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {submissions.length === 0 && (
                                                <TableRow><TableCell colSpan={4} align="center">No submissions.</TableCell></TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            </Paper>
                        )}

                        {(viewMode === "filling" || viewMode === "editing") && selectedForm && (
                            <Paper sx={{ p: 4 }}>
                                <Typography variant="h6" gutterBottom>{viewMode === "editing" ? "Edit Report" : "New Report"}</Typography>
                                <FormRenderer
                                    form={selectedForm}
                                    values={formValues}
                                    onChange={handleFormChange}
                                    onSubmit={handleSubmit}
                                    isSubmitting={isSubmitting}
                                    logoUrl={logoUrl}
                                />
                            </Paper>
                        )}

                        {viewMode === "viewed" && selectedForm && (
                            <Box sx={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center', py: 4 }}>
                                <Paper
                                    elevation={3}
                                    sx={{
                                        width: '210mm',
                                        minHeight: '297mm',
                                        p: '20mm',
                                        position: 'relative',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        boxSizing: 'border-box'
                                    }}
                                    ref={printRef}
                                >
                                    {/* Form Content - Grows to push footer down */}
                                    <Box sx={{ flex: 1 }}>
                                        <FormRenderer
                                            form={selectedForm}
                                            values={formValues}
                                            readOnly={true}
                                            hideTitle={true} // Clean view
                                            logoUrl={logoUrl}
                                        />
                                    </Box>

                                    {/* Footer: Black Line + Logo Bottom Right */}
                                    <Box sx={{ mt: 4, pt: 2, borderTop: "2px solid black", display: "flex", justifyContent: "flex-end" }}>
                                        <Box
                                            component="img"
                                            src={logoUrl || "/logo.png"}
                                            alt="Company Logo"
                                            sx={{
                                                height: 40,
                                                width: "auto"
                                            }}
                                        />
                                    </Box>
                                </Paper>
                            </Box>
                        )}
                    </Box>
                </Box>
            </Box>

            <FormSelectionDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSelect={handleSelectForm} />

            {/* Success Dialog */}
            <Dialog open={successOpen} maxWidth="xs" fullWidth>
                <DialogTitle>Success 🎉</DialogTitle>
                <DialogContent><Typography>Operation completed successfully.</Typography></DialogContent>
                <DialogActions>
                    <Button onClick={handleSuccessClose} variant="contained">View Report</Button>
                </DialogActions>
            </Dialog>

            {/* Delete Confirm */}
            <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
                <DialogTitle>Delete Report?</DialogTitle>
                <DialogContent>Are you sure you want to delete this report? This action cannot be undone.</DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
                </DialogActions>
            </Dialog>

            {/* Email Dialog */}
            <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)}>
                <DialogTitle>Send Report by Email</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Recipient Email"
                        type="email"
                        fullWidth
                        variant="outlined"
                        value={recipientEmail}
                        onChange={(e) => setRecipientEmail(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleEmailSend} variant="contained">Send</Button>
                </DialogActions>
            </Dialog>

            {/* Action Menu */}
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                <MenuItem onClick={() => handleAction("view")}>
                    <ListItemIcon><MoreVertIcon fontSize="small" /></ListItemIcon> <ListItemText>View</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction("edit")}>
                    <ListItemIcon><EditIcon fontSize="small" /></ListItemIcon> <ListItemText>Edit</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction("download")}>
                    <ListItemIcon><DownloadIcon fontSize="small" /></ListItemIcon> <ListItemText>Download PDF</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction("email")}>
                    <ListItemIcon><EmailIcon fontSize="small" /></ListItemIcon> <ListItemText>Sent to Mail</ListItemText>
                </MenuItem>
                <MenuItem onClick={() => handleAction("delete")}>
                    <ListItemIcon><DeleteIcon fontSize="small" color="error" /></ListItemIcon> <ListItemText sx={{ color: 'error.main' }}>Delete</ListItemText>
                </MenuItem>
            </Menu>
        </>
    );
}
