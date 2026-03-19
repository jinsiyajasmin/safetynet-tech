import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";
import { useRef } from "react";

export default function SiteInductionForm() {
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
    const [headerData, setHeaderData] = useState({
        projectTitle: "",
        scopeOfWork: "",
        location: "",
        contractNo: ""
    });
    
    // Grid Data for Signatures (10 rows)
    const [attendees, setAttendees] = useState(
        Array(10).fill({ date: "", name: "", signature: "", employedBy: "", occupation: "", competencyCard: "", cardDetails: "", inductor: "" })
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
                downloadPdfFromRef(containerRef, `SiteInduction_${id}`, () => {
                    setDownloading(false);
                    // Close the newly opened tab
                    window.close();
                });
            }, 800);
        }
    }, [loading, action, id]);

    const loadSubmission = async (submissionId) => {
        setLoading(true);
        try {
            // Fetch responses user has submitted to populate this form
            const res = await api.get('/forms/responses');
            if (res.data?.success) {
                const submission = res.data.data.find(r => r.id === submissionId || r._id === submissionId);
                if (submission && submission.answers) {
                    if (submission.answers.docInfo) setDocInfo(submission.answers.docInfo);
                    if (submission.answers.headerData) setHeaderData(submission.answers.headerData);
                    if (submission.answers.attendees) setAttendees(submission.answers.attendees);
                }
            }
        } catch (e) {
            console.error("Failed to load submission", e);
        } finally {
            setLoading(false);
        }
    };

    const handleHeaderChange = (field) => (e) => {
        setHeaderData({ ...headerData, [field]: e.target.value });
    };

    const handleAttendeeChange = (index, field) => (e) => {
        const newAttendees = [...attendees];
        newAttendees[index] = { ...newAttendees[index], [field]: e.target.value };
        setAttendees(newAttendees);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const formData = { docInfo, headerData, attendees };
            if (siteId) formData.siteId = siteId;
            
            if (id) {
                // Update existing
                await api.put(`/forms/responses/${id}`, { answers: formData });
            } else {
                // Determine template Form ID, then save a new response
                const formId = await getOrCreateTemplateForm("Site Induction Register");
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

    // Styling configurations matching layout
    const borderColor = "#CCC";
    const cellPadding = "4px 8px";
    
    const headerBgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#F9FAFB";
    const secondaryHeaderBgColor = isDarkMode ? "rgba(255,255,255,0.1)" : "#E5E7EB";
    const textColor = isDarkMode ? "#F9FAFB" : "#111827";

    if (loading) return <Layout><Box sx={{display:'flex', justifyContent:'center', py:10}}><CircularProgress/></Box></Layout>;

    return (
        <Layout>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => siteId ? navigate('/sitepack-management', { state: { siteId, moduleTitle: category } }) : navigate('/general-forms')} sx={{ bgcolor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <ArrowLeft size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                        Site Induction Register
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

            <Box sx={{ width: '100%', overflowX: 'auto', mb: 8 }}>
                <Box sx={{ minWidth: { xs: "1100px", md: "1100px" }, display: 'flex', justifyContent: 'center', px: { xs: 2, md: 0 } }}>
                    {/* Form Container */}
                    <Paper 
                        ref={containerRef}
                        elevation={3} 
                        sx={{ 
                            width: "100%", 
                            maxWidth: "1200px", 
                            p: 4, 
                            bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF", 
                            color: textColor,
                            borderRadius: 2,
                            border: "2px solid #000000"
                        }}
                    >
                        {/* Top Header Logos and Document Info */}
                        <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 4, width: '100%', maxWidth: '800px', mx: 'auto' }}>
                        {/* Left Logo */}
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                        
                        {/* Center Info */}
                        <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                SITE INDUCTION REGISTER
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>Approved by</Box>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '40%', p: 1 }}>Page 1 of 1</Box>
                            </Box>
                        </Box>

                        {/* Right Logo */}
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Briefing Info Header */}
                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, borderBottom: 'none' }}>
                        <Box sx={{ width: '25%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, bgcolor: headerBgColor }}>Project title</Box>
                        <Box sx={{ width: '35%', display: 'flex', borderRight: `1px solid ${borderColor}` }}>
                            <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, p: cellPadding } }} value={headerData.projectTitle} onChange={handleHeaderChange("projectTitle")} />
                        </Box>
                        <Box sx={{ width: '15%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, bgcolor: headerBgColor }}>Scope of Work</Box>
                        <Box sx={{ width: '25%', display: 'flex' }}>
                            <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, p: cellPadding } }} value={headerData.scopeOfWork} onChange={handleHeaderChange("scopeOfWork")} />
                        </Box>
                    </Box>

                    <Box sx={{ display: 'flex', border: `1px solid ${borderColor}` }}>
                        <Box sx={{ width: '25%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, bgcolor: headerBgColor }}>Location</Box>
                        <Box sx={{ width: '35%', display: 'flex', borderRight: `1px solid ${borderColor}` }}>
                            <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, p: cellPadding } }} value={headerData.location} onChange={handleHeaderChange("location")} />
                        </Box>
                        <Box sx={{ width: '15%', p: cellPadding, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, bgcolor: headerBgColor }}>Contract no.</Box>
                        <Box sx={{ width: '25%', display: 'flex' }}>
                            <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, p: cellPadding } }} value={headerData.contractNo} onChange={handleHeaderChange("contractNo")} />
                        </Box>
                    </Box>

                    <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', borderBottom: 'none', p: 1, textAlign: 'center', fontWeight: 'bold', fontSize: '0.9rem', bgcolor: secondaryHeaderBgColor }}>
                        I confirm that I have attended the site induction, understand the site rules and that I am not taking medication or drugs that could affect my concentration or safety on site
                    </Box>

                    {/* Signatures Table */}
                    <Box sx={{ border: `1px solid ${borderColor}`, mb: 4 }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}`, fontWeight: 'bold', textAlign: 'center', fontSize: '0.8rem', bgcolor: headerBgColor }}>
                            <Box sx={{ width: '10%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                            <Box sx={{ width: '15%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Name<br/>(capitals)</Box>
                            <Box sx={{ width: '12%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Signature</Box>
                            <Box sx={{ width: '13%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Employed by<br/><span style={{color: '#FF6B6B', fontSize: '0.7rem'}}>(this column to be completed by Subcontractors only)</span></Box>
                            <Box sx={{ width: '15%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Occupation</Box>
                            
                            <Box sx={{ width: '10%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                                <Box sx={{ flex: 1, p: cellPadding, borderBottom: `1px solid ${borderColor}` }}>Approved<br/>competency<br/>card/ cert<br/><span style={{fontSize: '0.7rem', fontWeight: 'normal'}}>(i.e. CSCS/CPCS)</span></Box>
                                <Box sx={{ display: 'flex', height: '25px' }}>
                                    <Box sx={{ width: '50%', borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B' }}>Yes</Box>
                                    <Box sx={{ width: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF6B6B' }}>No</Box>
                                </Box>
                            </Box>

                            <Box sx={{ width: '15%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Type of card held<br/><span style={{fontSize: '0.7rem', fontWeight: 'normal', fontStyle: 'italic'}}>(Plus, Card number and<br/>Expiry Date)</span></Box>
                            <Box sx={{ width: '10%', p: cellPadding }}>Person giving induction</Box>
                        </Box>
                        
                        {attendees.map((att, index) => (
                            <Box key={index} sx={{ display: 'flex', borderBottom: index < 9 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '10%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.date} onChange={handleAttendeeChange(index, "date")} />
                                </Box>
                                <Box sx={{ width: '15%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.name} onChange={handleAttendeeChange(index, "name")} />
                                </Box>
                                <Box sx={{ width: '12%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.signature} onChange={handleAttendeeChange(index, "signature")} />
                                </Box>
                                <Box sx={{ width: '13%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.employedBy} onChange={handleAttendeeChange(index, "employedBy")} />
                                </Box>
                                <Box sx={{ width: '15%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.occupation} onChange={handleAttendeeChange(index, "occupation")} />
                                </Box>

                                {/* Competency Card Yes/No split */}
                                <Box sx={{ width: '10%', display: 'flex', borderRight: `1px solid ${borderColor}` }}>
                                    <Box sx={{ width: '50%', borderRight: `1px solid ${borderColor}` }}>
                                        <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem', textAlign: 'center' } }} value={att.competencyCard === "Yes" ? "✓" : ""} onClick={() => handleAttendeeChange(index, "competencyCard")({target:{value: "Yes"}})} />
                                    </Box>
                                    <Box sx={{ width: '50%' }}>
                                        <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem', textAlign: 'center' } }} value={att.competencyCard === "No" ? "✓" : ""} onClick={() => handleAttendeeChange(index, "competencyCard")({target:{value: "No"}})} />
                                    </Box>
                                </Box>

                                <Box sx={{ width: '15%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.cardDetails} onChange={handleAttendeeChange(index, "cardDetails")} />
                                </Box>
                                <Box sx={{ width: '10%' }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5, height: '100%', fontSize: '0.85rem' } }} value={att.inductor} onChange={handleAttendeeChange(index, "inductor")} />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                </Paper>
                </Box>
            </Box>
        </Layout>
    );
}
