import React, { useState, useEffect } from "react";
import { Box, Typography, Button, Paper, TextField, Table, TableBody, TableCell, TableHead, TableRow, TableContainer, CircularProgress, IconButton } from "@mui/material";
import { Download, ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";
import { useRef } from "react";

export default function ToolBoxTalkForm() {
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

    const [headerData, setHeaderData] = useState({
        presenter: "",
        date: "",
        site: "",
        topic: ""
    });

    // Common Document Header
    const [docInfo, setDocInfo] = useState({
        date: "",
        docNo: "",
        approvedBy: ""
    });
    
    const [attendees, setAttendees] = useState(
        Array(10).fill({ printName: "", signature: "", date: "" })
    );

    const [consultation, setConsultation] = useState("");

    useEffect(() => {
        if (id) {
            loadSubmission(id);
        }
    }, [id]);

    useEffect(() => {
        if (!loading && action === "download" && id) {
            setDownloading(true);
            setTimeout(() => {
                downloadPdfFromRef(containerRef, `ToolBoxTalk_${id}`, () => {
                    setDownloading(false);
                    // Close the newly opened tab
                    window.close();
                });
            }, 800); // Short delay for render
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
                    if (submission.answers.headerData) setHeaderData(submission.answers.headerData);
                    if (submission.answers.attendees) setAttendees(submission.answers.attendees);
                    if (submission.answers.consultation !== undefined) setConsultation(submission.answers.consultation);
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
            const formData = { docInfo, headerData, attendees, consultation };
            if (siteId) formData.siteId = siteId; // Inject site context
            
            if (id) {
                await api.put(`/forms/responses/${id}`, { answers: formData });
            } else {
                const formId = await getOrCreateTemplateForm("Tool Box Talk Register");
                await api.post(`/forms/${formId}/responses`, {
                    answers: formData,
                    category: category // Use dynamic category
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

    // Styling configurations for the exact look
    const borderColor = "#CCC";
    const headerBgColor = "#F9FAFB";
    const headerTextColor = "#111827";
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
                        Tool Box Talk Register
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
                        minWidth: "900px",
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
                                TOOL BOX TALK REGISTER
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '60%', p: 1, borderRight: `1px solid ${borderColor}` }}>Document No. & Rev</Box>
                                <Box sx={{ width: '40%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>Approved by</Box>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />
                                </Box>
                                <Box sx={{ width: '40%', p: 1 }}>Page 1 of 1</Box>
                            </Box>
                        </Box>

                        {/* Right Logo */}
                        <Box sx={{ width: '30%', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
                        </Box>
                    </Box>

                    {/* Presenter Info Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', border: `1px solid ${borderColor}` }}>
                        {[
                            { label: "Name of Presenter", field: "presenter" },
                            { label: "Date", field: "date" },
                            { label: "Site", field: "site" },
                            { label: "Tool Box Talk Topic:", field: "topic" }
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
                                        value={headerData[row.field]}
                                        onChange={handleHeaderChange(row.field)}
                                    />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Disclaimer Text */}
                    <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', p: 2 }}>
                        <Typography sx={{ fontSize: '0.9rem', lineHeight: 1.5 }}>
                            The undersigned have been fully briefed on the contents of the attached Tool Box Talk and will ensure they work to the agreed safe system of work in place at all times and shall raise any concerns directly with the Site Supervisor or Construct Lifts Installation Director.
                        </Typography>
                    </Box>

                    {/* Attendees Table */}
                    <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none' }}>
                        <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: '5%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}></Box>
                            <Box sx={{ width: '35%', p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>Print Name</Box>
                            <Box sx={{ width: '35%', p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>Signature</Box>
                            <Box sx={{ width: '25%', p: cellPadding, textAlign: 'center' }}>Date</Box>
                        </Box>
                        
                        {attendees.map((attendee, index) => (
                            <Box key={index} sx={{ display: 'flex', borderBottom: index < 9 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: '5%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                    {index + 1}
                                </Box>
                                <Box sx={{ width: '35%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, height: '100%' } }} value={attendee.printName} onChange={handleAttendeeChange(index, "printName")} />
                                </Box>
                                <Box sx={{ width: '35%', borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, height: '100%' } }} value={attendee.signature} onChange={handleAttendeeChange(index, "signature")} />
                                </Box>
                                <Box sx={{ width: '25%' }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, height: '100%' } }} value={attendee.date} onChange={handleAttendeeChange(index, "date")} />
                                </Box>
                            </Box>
                        ))}
                    </Box>

                    {/* Consultation Section */}
                    <Box sx={{ border: `1px solid ${borderColor}`, borderTop: 'none', minHeight: '150px', display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ p: cellPadding }}>
                            <Typography sx={{ fontWeight: 'bold', textDecoration: 'underline', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                Consultation (record all consultation comments raised during the tool box talk)
                            </Typography>
                        </Box>
                        <TextField 
                            fullWidth 
                            multiline 
                            minRows={4} 
                            variant="standard" 
                            InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 2, pb: 2, pt: 0 } }}
                            value={consultation}
                            onChange={(e) => setConsultation(e.target.value)}
                        />
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
