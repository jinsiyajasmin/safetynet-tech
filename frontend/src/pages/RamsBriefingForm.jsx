import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";
import { useRef } from "react";

export default function RamsBriefingForm() {
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
    
    // Header Data
    const [docInfo, setDocInfo] = useState({ date: "", docNo: "", approvedBy: "" });
    const [briefingData, setBriefingData] = useState({
        personConducting: "",
        jobTitle: "",
        projectName: "",
        principalContractor: "",
        inducteeName: "",
        inducteeJobTitle: ""
    });
    
    // Grid Data for Signatures (15 rows)
    const [signatures, setSignatures] = useState(
        Array(15).fill({ documentTitle: "", date: "", signatureInductee: "", signatureInductor: "" })
    );

    useEffect(() => {
        if (id) {
            loadSubmission(id);
        }
    }, [id]);

    useEffect(() => {
        if (!loading && action === "download" && id) {
            setDownloading(true);
            setTimeout(() => {
                downloadPdfFromRef(containerRef, `RAMSBriefing_${id}`, () => {
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
                    if (submission.answers.briefingData) setBriefingData(submission.answers.briefingData);
                    if (submission.answers.signatures) setSignatures(submission.answers.signatures);
                }
            }
        } catch (e) {
            console.error("Failed to load submission", e);
        } finally {
            setLoading(false);
        }
    };

    const handleBriefingChange = (field) => (e) => {
        setBriefingData({ ...briefingData, [field]: e.target.value });
    };

    const handleSignatureChange = (index, field) => (e) => {
        const newSignatures = [...signatures];
        newSignatures[index] = { ...newSignatures[index], [field]: e.target.value };
        setSignatures(newSignatures);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = { docInfo, briefingData, signatures };
            if (siteId) formData.siteId = siteId;
            
            if (id) {
                await api.put(`/forms/responses/${id}`, { answers: formData });
            } else {
                const formId = await getOrCreateTemplateForm("RAMS Briefing Form");
                await api.post(`/forms/${formId}/responses`, {
                    answers: formData,
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

    // Styling configurations to match light/dark modes
    const borderColor = "#CCC";
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
                        RAMS Briefing Form
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
                {/* Form Container */}
                <Paper 
                    ref={containerRef}
                    elevation={3} 
                    sx={{ 
                        width: "100%", 
                        minWidth: "1000px",
                        maxWidth: "1000px", 
                        p: 4, 
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF", 
                        color: isDarkMode ? "#F9FAFB" : "#111827",
                        borderRadius: 2,
                        border: (downloading || action === 'download') ? "1px solid #ccc" : "none",
                        boxShadow: (downloading || action === 'download') ? "none" : undefined
                    }}
                >
                    {/* Top Header Logos and Document Info */}
                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 4 }}>
                        {/* Left Logo */}
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                        
                        {/* Center Info */}
                        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                RAMS BRIEFING REGISTER
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>Approved by</Box>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '40%', p: 1 }}>Page 1 of 1</Box>
                            </Box>
                        </Box>

                        {/* Right Logo */}
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Form Title */}
                    <Typography variant="h6" sx={{ textAlign: "center", mb: 3 }}>
                        Risk Assessment & Method Statement (RAMS) Briefing Form
                    </Typography>

                    {/* Briefing Info Table 1 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', border: `1px solid ${borderColor}`, mb: 3 }}>
                        {[
                            { label: "Name of Person conducting Briefing", field: "personConducting" },
                            { label: "Job Title", field: "jobTitle" },
                            { label: "Project Name / Title", field: "projectName" },
                            { label: "Name of Principal Contractor", field: "principalContractor" }
                        ].map((row, index) => (
                            <Box key={row.field} sx={{ display: 'flex', borderBottom: index < 3 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '40%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    {row.label}
                                </Box>
                                <Box sx={{ width: '60%', display: 'flex' }}>
                                    <TextField 
                                        fullWidth 
                                        variant="standard" 
                                        InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", p: cellPadding } }}
                                        value={briefingData[row.field]}
                                        onChange={handleBriefingChange(row.field)}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Typography sx={{ mb: 3, fontSize: '0.95rem', lineHeight: 1.5 }}>
                        I confirm that I have read and understand the requirements of this method statement and associated risk assessments and have communicated them to operatives/persons under my control and to those who may be affected by its requirements.
                    </Typography>

                    {/* Briefing Info Table 2 */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', border: `1px solid ${borderColor}`, mb: 3 }}>
                        {[
                            { label: "Name of Inductee", field: "inducteeName" },
                            { label: "Job Title", field: "inducteeJobTitle" }
                        ].map((row, index) => (
                            <Box key={row.field} sx={{ display: 'flex', borderBottom: index < 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '40%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    {row.label}
                                </Box>
                                <Box sx={{ width: '60%', display: 'flex' }}>
                                    <TextField 
                                        fullWidth 
                                        variant="standard" 
                                        InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", p: cellPadding } }}
                                        value={briefingData[row.field]}
                                        onChange={handleBriefingChange(row.field)}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    <Typography sx={{ mb: 3, fontSize: '0.95rem', lineHeight: 1.5 }}>
                        I hereby confirm that I have received, read and fully understood the approved site Risk Assessment & Method Statement (RAMS) and sign to say that I fully agree to adhere to the contents of the method statement(s) and the associated risk assessments.<br/>
                        I have attended a site induction/briefing that explained the general site rules and necessary site specific arrangements
                    </Typography>

                    {/* Signatures Table */}
                    <Box sx={{ border: `1px solid ${borderColor}`, mb: 4 }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, fontWeight: 'bold', textAlign: 'center' }}>
                            <Box sx={{ width: '40%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Document Title</Box>
                            <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Date</Box>
                            <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Signature of<br/>Inductee</Box>
                            <Box sx={{ width: '20%', p: cellPadding, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Signature of<br/>Inductor</Box>
                        </Box>
                        
                        {signatures.map((sig, index) => (
                            <Box key={index} sx={{ display: 'flex', borderBottom: index < 14 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '40%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 0.5, height: '100%' } }} value={sig.documentTitle} onChange={handleSignatureChange(index, "documentTitle")} />
                                </Box>
                                <Box sx={{ width: '20%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 0.5, height: '100%' } }} value={sig.date} onChange={handleSignatureChange(index, "date")} />
                                </Box>
                                <Box sx={{ width: '20%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 0.5, height: '100%' } }} value={sig.signatureInductee} onChange={handleSignatureChange(index, "signatureInductee")} />
                                </Box>
                                <Box sx={{ width: '20%' }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, py: 0.5, height: '100%' } }} value={sig.signatureInductor} onChange={handleSignatureChange(index, "signatureInductor")} />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Declaration Statement */}
                    <Box sx={{ mt: 4 }}>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '1rem', mb: 0.5 }}>
                            Declaration Statement
                        </Typography>
                        <Typography sx={{ fontStyle: 'italic', fontSize: '0.95rem', mb: 3 }}>
                            By signing above, I confirm that I will work safely in accordance with the above documentation, attend weekly toolbox talks and training, follow site rules as per site induction and shall be responsible for my own health and safety as well as that of others and shall report any concerns immediately to the Site Person in charge
                        </Typography>
                        <Typography sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>
                            If you have any doubt about information given or contained in this method statement – ask for clarification.
                        </Typography>
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
