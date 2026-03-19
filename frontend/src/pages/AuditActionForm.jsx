import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";

export default function AuditActionForm() {
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

    // Common Document Header
    const [docInfo, setDocInfo] = useState({
        date: "",
        docNo: "",
        approvedBy: ""
    });

    const [formData, setFormData] = useState({
        detailsOfObservation: "",
        raisedBy: "",
        agreedWithObs: "",
        proposedAction: "",
        agreedWithAct: "",
        dateForCompletion: "",
        
        followUpAction: "",
        auditedBy: "",
        auditDate: "",
        auditSignature: "",
        
        auditSummary: "",
        clause: ""
    });

    useEffect(() => {
        if (id) {
            loadSubmission(id);
        }
    }, [id]);

    useEffect(() => {
        if (!loading && action === "download" && id) {
            setDownloading(true);
            setTimeout(() => {
                downloadPdfFromRef(containerRef, `AuditAction_${id}`, () => {
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
                    if (submission.answers.formData) setFormData(submission.answers.formData);
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
            const payload = { docInfo, formData };
            if (siteId) payload.siteId = siteId;
            
            if (id) {
                await api.put(`/forms/responses/${id}`, { answers: payload });
            } else {
                const formId = await getOrCreateTemplateForm("Audit Action Form");
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

    const updateField = (field) => (e) => {
        setFormData({ ...formData, [field]: e.target.value });
    };

    const borderColor = isDarkMode ? "#374151" : "#CCC";
    const headerBgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#E5E7EB";
    const textColor = isDarkMode ? "#F9FAFB" : "#111827";
    const cellPadding = "8px 12px";

    if (loading) return <Layout><Box sx={{display:'flex', justifyContent:'center', py:10}}><CircularProgress/></Box></Layout>;

    return (
        <Layout>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => siteId ? navigate('/sitepack-management', { state: { siteId, moduleTitle: category } }) : navigate('/general-forms')} sx={{ bgcolor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <ArrowLeft size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                        Audit Action Form
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
                        minWidth: "1000px",
                        maxWidth: "1000px", 
                        p: 4, 
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF", 
                        color: textColor,
                        borderRadius: 2,
                        border: (downloading || action === 'download') ? "1px solid #ccc" : "none"
                    }}
                >
                    {/* PAGE 1 */}
                    
                    {/* Top Header Logos and Document Info */}
                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 4 }}>
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                        
                        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                AUDIT ACTION FORM
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: 1, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: 1, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>Approved by</Box>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '40%', p: 1 }}>Page 1 of 2</Box>
                            </Box>
                        </Box>

                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Table 1 */}
                    <Box sx={{ border: `1px solid ${borderColor}`, mb: 8 }}>
                        {/* Header Row */}
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, bgcolor: headerBgColor, fontWeight: 'bold', textAlign: 'center' }}>
                            <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>ACTION FORM</Box>
                            <Box sx={{ width: '60%', p: cellPadding, textAlign: 'left' }}>Reference</Box>
                        </Box>
                        
                        {/* Details of Observation */}
                        <Box sx={{ borderBottom: `1px solid ${borderColor}`, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Details of Observation</Box>
                            <Box sx={{ flex: 1, px: 1, pb: 1 }}>
                                <TextField fullWidth multiline minRows={8} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, height: '100%' } }} value={formData.detailsOfObservation} onChange={updateField("detailsOfObservation")} />
                            </Box>
                        </Box>

                        {/* Raised by / Agreed with */}
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: '40%', display: 'flex', flexWrap: 'wrap', borderRight: `1px solid ${borderColor}` }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Raised by</Box>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1 } }} value={formData.raisedBy} onChange={updateField("raisedBy")} />
                            </Box>
                            <Box sx={{ width: '60%', display: 'flex', flexWrap: 'wrap' }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Agreed with</Box>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1 } }} value={formData.agreedWithObs} onChange={updateField("agreedWithObs")} />
                            </Box>
                        </Box>

                        {/* PROPOSED ACTION Header */}
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, bgcolor: headerBgColor, fontWeight: 'bold', textAlign: 'center' }}>
                            <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>PROPOSED / AGREED ACTION</Box>
                            <Box sx={{ width: '60%', p: cellPadding }}></Box>
                        </Box>

                        {/* Action Details */}
                        <Box sx={{ borderBottom: `1px solid ${borderColor}`, minHeight: '300px', display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ flex: 1, p: 1 }}>
                                <TextField fullWidth multiline minRows={8} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, height: '100%' } }} value={formData.proposedAction} onChange={updateField("proposedAction")} />
                            </Box>
                        </Box>

                        {/* Agreed with / Date for Completion */}
                        <Box sx={{ display: 'flex' }}>
                            <Box sx={{ width: '40%', display: 'flex', flexWrap: 'wrap', borderRight: `1px solid ${borderColor}` }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Agreed with</Box>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, pb: 1 } }} value={formData.agreedWithAct} onChange={updateField("agreedWithAct")} />
                            </Box>
                            <Box sx={{ width: '60%', display: 'flex', flexWrap: 'wrap' }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Date for Completion</Box>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, pb: 1 } }} value={formData.dateForCompletion} onChange={updateField("dateForCompletion")} />
                            </Box>
                        </Box>
                    </Box>

                    {/* PAGE BREAK CONTENT (simulated visual break) */}
                    <Box sx={{ height: '40px' }}></Box>

                    {/* PAGE 2 - Top Header Logos and Document Info */}
                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 4 }}>
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                        
                        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                AUDIT ACTION FORM
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: 1, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '40%', p: 1, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '60%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>Approved by</Box>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '40%', p: 1 }}>Page 2 of 2</Box>
                            </Box>
                        </Box>

                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Follow Up Action Table */}
                    <Box sx={{ border: `1px solid ${borderColor}`, mb: 4 }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, bgcolor: headerBgColor, fontWeight: 'bold', textAlign: 'center' }}>
                            <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>FOLLOW UP ACTION</Box>
                            <Box sx={{ width: '60%', p: cellPadding, textAlign: 'left' }}>The agreed action has\has not been implemented and found to be effective</Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', minHeight: '200px' }}>
                            <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                                <Box sx={{ p: cellPadding }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>AUDITED BY</Typography>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor } }} value={formData.auditedBy} onChange={updateField("auditedBy")} />
                                </Box>
                                <Box sx={{ p: cellPadding, mt: 2 }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>DATE</Typography>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor } }} value={formData.auditDate} onChange={updateField("auditDate")} />
                                </Box>
                            </Box>
                            <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: cellPadding }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>SIG</Typography>
                                    <TextField fullWidth multiline minRows={4} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor } }} value={formData.auditSignature} onChange={updateField("auditSignature")} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                    <TextField fullWidth multiline minRows={4} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 2, pb: 1, height: '100%' } }} value={formData.followUpAction} onChange={updateField("followUpAction")} placeholder="Follow up notes..." />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* Audit Report Continuation */}
                    <Box sx={{ border: `1px solid ${borderColor}` }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, bgcolor: headerBgColor, fontWeight: 'bold' }}>
                            <Box sx={{ width: '60%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>AUDIT REPORT CONTINUATION</Box>
                            <Box sx={{ width: '40%', p: cellPadding }}>PAGE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; OF &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</Box>
                        </Box>
                        
                        <Box sx={{ display: 'flex', minHeight: '500px' }}>
                            <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>AUDIT SUMMARY</Box>
                                <Box sx={{ flex: 1, p: 1 }}>
                                    <TextField fullWidth multiline minRows={18} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, height: '100%' } }} value={formData.auditSummary} onChange={updateField("auditSummary")} />
                                </Box>
                            </Box>
                            <Box sx={{ width: '60%', display: 'flex', flexDirection: 'column' }}>
                                <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Clause</Box>
                                <Box sx={{ flex: 1, p: 1 }}>
                                    <TextField fullWidth multiline minRows={18} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, height: '100%' } }} value={formData.clause} onChange={updateField("clause")} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
