import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";

export default function PuwerInspectionForm() {
    const { isDarkMode } = useTheme();
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const siteId = searchParams.get("siteId");
    const category = searchParams.get("category") || "General forms";
    const action = searchParams.get("action");
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);

    // Initial State Structure mapped from form image
    const [docInfo, setDocInfo] = useState({
        date: "May 2023",
        docNo: "CL-F-39 – Rev 0",
        approvedBy: "R. Lewis"
    });

    const [topSection, setTopSection] = useState({
        projectName: "",
        projectManager: "",
        principalContractor: "",
        siteSupervisor: ""
    });

    const [tableRows, setTableRows] = useState(Array(12).fill({
        dateOfInspection: "",
        descriptionOfPlant: "",
        idNo: "",
        dateOfPatInspection: "",
        detailsOfInspection: "",
        inspectedBy: ""
    }));

    useEffect(() => {
        if (id) {
            loadSubmission(id);
        }
    }, [id]);

    useEffect(() => {
        if (!loading && action === "download" && id) {
            setDownloading(true);
            setTimeout(() => {
                downloadPdfFromRef(containerRef, `PuwerInspectionForm_${id}`, () => {
                    setDownloading(false);
                    window.close();
                });
            }, 800);
        }
    }, [loading, action, id]);

    const loadSubmission = async (submissionId) => {
        setLoading(true);
        try {
            const res = await api.get('/forms/responses');
            if (res.data?.success) {
                const submission = res.data.data.find(r => r.id === submissionId || r._id === submissionId);
                if (submission && submission.answers) {
                    if (submission.answers.docInfo) setDocInfo(submission.answers.docInfo);
                    if (submission.answers.topSection) setTopSection(submission.answers.topSection);
                    if (submission.answers.tableRows) setTableRows(submission.answers.tableRows);
                }
            }
        } catch (e) {
            console.error("Failed to load submission", e);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const payload = { docInfo, topSection, tableRows };
            if (siteId) payload.siteId = siteId;
            
            if (id) {
                await api.put(`/forms/responses/${id}`, { answers: payload });
            } else {
                const formId = await getOrCreateTemplateForm("PUWER Inspection Form");
                await api.post(`/forms/${formId}/responses`, {
                    answers: payload,
                    category: category
                });
            }
            if (siteId) {
                navigate('/sitepack-management', { state: { siteId, moduleTitle: category } });
            } else {
                navigate('/general-forms');
            }
        } catch (e) {
            console.error("Failed to save", e);
            alert("Failed to save the form.");
        } finally {
            setSaving(false);
        }
    };

    const updateTopSection = (field) => (e) => {
        setTopSection({ ...topSection, [field]: e.target.value });
    };

    const updateTableRow = (index, field, value) => {
        const newRows = [...tableRows];
        newRows[index] = { ...newRows[index], [field]: value };
        setTableRows(newRows);
    };

    const borderColor = isDarkMode ? "#374151" : "#CCC";
    const headerBgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#222222";
    const textColor = isDarkMode ? "#F9FAFB" : "#111827";
    const cellPadding = "6px 8px";

    if (loading) return <Layout><Box sx={{display:'flex', justifyContent:'center', py:10}}><CircularProgress/></Box></Layout>;

    return (
        <Layout>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => siteId ? navigate('/sitepack-management', { state: { siteId, moduleTitle: category } }) : navigate('/general-forms')} sx={{ bgcolor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <ArrowLeft size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                        PUWER Inspection Form
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={handleSave}
                    disabled={saving}
                    sx={{ 
                        bgcolor: "#E89F17", 
                        color: "#FFFFFF", 
                        fontWeight: 600, 
                        borderRadius: "8px",
                        boxShadow: "none",
                        "&:hover": { bgcolor: "#cc8b14", boxShadow: "none" } 
                    }}
                >
                    {downloading ? "Downloading PDF..." : (saving ? "Saving..." : "Save Form")}
                </Button>
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 8, overflowX: "auto", px: { xs: 2, md: 0 } }}>
                <Paper 
                    ref={containerRef}
                    elevation={ (downloading || action === 'download') ? 0 : 3 } 
                    sx={{ 
                        width: "100%", 
                        minWidth: "1100px",
                        maxWidth: "1100px", 
                        p: { xs: 2, md: 5 }, 
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF", 
                        color: textColor,
                        borderRadius: 2,
                        border: (downloading || action === 'download') ? "1px solid #ccc" : "none",
                        fontFamily: 'Arial, sans-serif'
                    }}
                >
                    {/* Header */}
                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 3 }}>
                        <Box sx={{ width: '25%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                        
                        <Box sx={{ width: '50%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '1.2rem', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                PUWER INSPECTION
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Approved by</Box>
                                <Box sx={{ width: '40%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '20%', p: cellPadding }}>Page 1 of 1</Box>
                            </Box>
                        </Box>

                        <Box sx={{ width: '25%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Top Section */}
                    <Box sx={{ border: `1px solid ${borderColor}`, mb: 3 }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: '25%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}` }}>Project Name</Box>
                            <Box sx={{ width: '35%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={topSection.projectName} onChange={updateTopSection("projectName")} />
                            </Box>
                            <Box sx={{ width: '20%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}` }}>Project Manager:</Box>
                            <Box sx={{ width: '20%', p: 0 }}>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={topSection.projectManager} onChange={updateTopSection("projectManager")} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: '25%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}` }}>Principal Contractor</Box>
                            <Box sx={{ width: '35%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={topSection.principalContractor} onChange={updateTopSection("principalContractor")} />
                            </Box>
                            <Box sx={{ width: '20%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}` }}>Site Supervisor</Box>
                            <Box sx={{ width: '20%', p: 0 }}>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={topSection.siteSupervisor} onChange={updateTopSection("siteSupervisor")} />
                            </Box>
                        </Box>
                        <Box sx={{ p: cellPadding, minHeight: '30px' }}></Box>
                    </Box>

                    {/* Table */}
                    <Box sx={{ border: `1px solid ${borderColor}` }}>
                        {/* Table Header */}
                        <Box sx={{ display: 'flex', fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: '12%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>Date of Inspection</Box>
                            <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>Description of Plant</Box>
                            <Box sx={{ width: '10%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                ID No.
                            </Box>
                            <Box sx={{ width: '12%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                Date of PAT<br/>Inspection
                            </Box>
                            <Box sx={{ width: '34%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                                Details of Inspection<br/>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5, fontWeight: 'normal' }}>(defects identified and action taken)</Typography>
                            </Box>
                            <Box sx={{ width: '12%', p: cellPadding, display: 'flex', alignItems: 'center' }}>
                                Inspected by
                            </Box>
                        </Box>

                        {/* Table Rows */}
                        {tableRows.map((row, index) => (
                            <Box key={index} sx={{ display: 'flex', borderBottom: index < tableRows.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '12%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.dateOfInspection} onChange={e => updateTableRow(index, 'dateOfInspection', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '20%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.descriptionOfPlant} onChange={e => updateTableRow(index, 'descriptionOfPlant', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '10%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.idNo} onChange={e => updateTableRow(index, 'idNo', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '12%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.dateOfPatInspection} onChange={e => updateTableRow(index, 'dateOfPatInspection', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '34%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.detailsOfInspection} onChange={e => updateTableRow(index, 'detailsOfInspection', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '12%', p: 0 }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.inspectedBy} onChange={e => updateTableRow(index, 'inspectedBy', e.target.value)} />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
