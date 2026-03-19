import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";

export default function LolerInspectionForm() {
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
        docNo: "CL-F-40 – Rev 0",
        approvedBy: "R. Lewis"
    });

    const [topSection, setTopSection] = useState({
        projectName: "",
        projectManager: "",
        principalContractor: "",
        siteSupervisor: ""
    });

    const [tableRows, setTableRows] = useState(Array(10).fill({
        equipment: "",
        plantId: "",
        swl: "",
        nextDate: "",
        matters: "",
        actionTaken: "",
        safeToUse: ""
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
                downloadPdfFromRef(containerRef, `LolerInspectionForm_${id}`, () => {
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
                const formId = await getOrCreateTemplateForm("LOLER Inspection Form");
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
                        LOLER Inspection Form
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
                                LOLER INSPECTION FORM
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
                            <Box sx={{ width: '18%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>Equipment Description</Box>
                            <Box sx={{ width: '12%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>Plant ID</Box>
                            <Box sx={{ width: '10%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                                S.W.L<br/>LOLER
                            </Box>
                            <Box sx={{ width: '12%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', textAlign: 'center' }}>
                                Next Thorough<br/>Examination Date
                            </Box>
                            <Box sx={{ width: '18%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', fontSize: '0.8rem' }}>
                                Matters giving rise to health or safety risk<br/>
                                <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }}>List damage / Defect or note none</Typography>
                            </Box>
                            <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', fontSize: '0.9rem' }}>
                                Details of action taken and any other action considered necessary
                            </Box>
                            <Box sx={{ width: '10%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: 1, borderBottom: `1px solid ${borderColor}`, textAlign: 'center', fontSize: '0.85rem' }}>Safe to use</Box>
                                <Box sx={{ display: 'flex', flex: 1 }}>
                                    <Box sx={{ width: '50%', borderRight: `1px solid ${borderColor}`, p: 1, textAlign: 'center', fontSize: '0.85rem' }}>Yes</Box>
                                    <Box sx={{ width: '50%', p: 1, textAlign: 'center', fontSize: '0.85rem' }}>No</Box>
                                </Box>
                            </Box>
                        </Box>

                        {/* Table Rows */}
                        {tableRows.map((row, index) => (
                            <Box key={index} sx={{ display: 'flex', borderBottom: index < tableRows.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '18%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.equipment} onChange={e => updateTableRow(index, 'equipment', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '12%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.plantId} onChange={e => updateTableRow(index, 'plantId', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '10%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.swl} onChange={e => updateTableRow(index, 'swl', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '12%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.nextDate} onChange={e => updateTableRow(index, 'nextDate', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '18%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.matters} onChange={e => updateTableRow(index, 'matters', e.target.value)} />
                                </Box>
                                <Box sx={{ width: '20%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={row.actionTaken} onChange={e => updateTableRow(index, 'actionTaken', e.target.value)} />
                                </Box>

                                {/* Checkboxes for Safe to use */}
                                <Box sx={{ width: '10%', display: 'flex' }}>
                                    <Box 
                                        onClick={() => updateTableRow(index, 'safeToUse', "Yes")}
                                        sx={{ 
                                            width: '50%', 
                                            borderRight: `1px solid ${borderColor}`, 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            bgcolor: row.safeToUse === "Yes" ? '#666' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    />
                                    <Box 
                                        onClick={() => updateTableRow(index, 'safeToUse', "No")}
                                        sx={{ 
                                            width: '50%', 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            justifyContent: 'center',
                                            bgcolor: row.safeToUse === "No" ? '#666' : 'transparent',
                                            cursor: 'pointer'
                                        }}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
