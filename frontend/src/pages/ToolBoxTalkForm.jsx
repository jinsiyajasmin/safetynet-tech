import React, { useState, useEffect } from "react";
import { 
    Box, Typography, Button, Paper, TextField, Table, TableBody, 
    TableCell, TableHead, TableRow, TableContainer, CircularProgress, 
    IconButton, Alert
} from "@mui/material";
import SaveChoiceDialog from "../components/SaveChoiceDialog";
import SignatureCapture from "../components/SignatureCapture";
import GeneralFormTableRowControls from "../components/GeneralFormTableRowControls";
import { Download, ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useGeneralFormRouteSubmissionIds } from "../hooks/useGeneralFormRouteSubmissionIds";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";
import { useRef } from "react";
import { useCompanyLogo } from "../hooks/useCompanyLogo";
import { useGeneralFormTemplateAccess } from "../hooks/useGeneralFormTemplateAccess";

export default function ToolBoxTalkForm() {
    const { isDarkMode } = useTheme();
    const logoUrl = useCompanyLogo();
    const { persistedResponseId, seedSubmissionId, fromTemplateId } = useGeneralFormRouteSubmissionIds();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const action = searchParams.get("action");
    const category = searchParams.get("category") || "General forms";
    const containerRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [downloading, setDownloading] = useState(false);
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [formMetadata, setFormMetadata] = useState({ name: "", tags: "" });

    const [headerData, setHeaderData] = useState({
        presenter: "",
        date: "",
        site: "",
        topic: ""
    });

    const [headerLabels, setHeaderLabels] = useState({
        formTitle: "TOOL BOX TALK REGISTER",
        dateLabel: "Date",
        docNoLabel: "Document No. & Rev",
        approvedByLabel: "Approved by",
        presenter: "Name of Presenter",
        date: "Date",
        site: "Site",
        topic: "Tool Box Talk Topic:"
    });

    // Common Document Header
    const [docInfo, setDocInfo] = useState({
        date: "",
        docNo: "",
        approvedBy: "",
        logo: ""
,
        logoRight: ""
    });
    
    const EMPTY_ATTENDEE = { printName: "", signature: "", date: "" };
    const [attendees, setAttendees] = useState(() =>
        Array.from({ length: 10 }, () => ({ ...EMPTY_ATTENDEE }))
    );

    const [consultation, setConsultation] = useState("");
    const [persistedSiteId, setPersistedSiteId] = useState(null);

    const { canEdit, siteId, pdfLayout, contentReadOnly } = useGeneralFormTemplateAccess(
        action,
        downloading,
        persistedSiteId
    );

    useEffect(() => {
        if (!persistedResponseId && !fromTemplateId) setPersistedSiteId(null);
    }, [persistedResponseId, fromTemplateId]);

    useEffect(() => {
        if (seedSubmissionId) {
            loadSubmission(seedSubmissionId);
        }
    }, [seedSubmissionId]);

    useEffect(() => {
        const docKey = persistedResponseId || seedSubmissionId;
        if (!loading && action === "download" && docKey) {
            setDownloading(true);
            setTimeout(() => {
                downloadPdfFromRef(containerRef, `ToolBoxTalk_${docKey}`, () => {
                    setDownloading(false);
                    // Close the newly opened tab
                    window.close();
                });
            }, 800); // Short delay for render
        }
    }, [loading, action, persistedResponseId, seedSubmissionId]);

    const loadSubmission = async (submissionId) => {
        setLoading(true);
        try {
            const res = await api.get('/forms/responses');
            if (res.data?.success) {
                const submission = res.data.data.find(r => r.id === submissionId || r._id === submissionId);
                if (submission && submission.answers) {
                    setPersistedSiteId(submission.answers.siteId ?? null);
                    if (submission.answers.docInfo) setDocInfo(submission.answers.docInfo);
                    if (submission.answers.headerData) setHeaderData(submission.answers.headerData);
                    if (submission.answers.headerLabels) setHeaderLabels(submission.answers.headerLabels);
                    if (submission.answers.attendees) setAttendees(submission.answers.attendees);
                    if (submission.answers.consultation !== undefined) setConsultation(submission.answers.consultation);
                    setFormMetadata({
                        name: submission.answers.name || `Tool Box Talk - ${new Date(submission.createdAt).toLocaleDateString()}`,
                        tags: submission.answers.tags || ""
                    });
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

    const insertAttendeeAfter = (index) => {
        setAttendees((a) => {
            if (a.length >= 35) return a;
            const next = [...a];
            next.splice(index + 1, 0, { ...EMPTY_ATTENDEE });
            return next;
        });
    };
    const removeAttendeeAt = (index) => {
        setAttendees((a) => (a.length <= 1 ? a : a.filter((_, i) => i !== index)));
    };

    const handleSaveClick = () => {
        setSaveDialogOpen(true);
    };

    const executeSave = async (asNew = false, name = "", tags = "") => {
        setSaving(true);
        try {
            const formData = { 
                docInfo, 
                headerData, 
                headerLabels, 
                attendees, 
                consultation,
                name: name || formMetadata.name,
                tags: tags || formMetadata.tags
            };
            if (siteId) formData.siteId = siteId; // Inject site context
            
            if (persistedResponseId && !asNew) {
                await api.put(`/forms/responses/${persistedResponseId}`, { answers: formData });
            } else {
                const formId = await getOrCreateTemplateForm("Tool Box Talk Register");
                await api.post(`/forms/${formId}/responses`, {
                    answers: formData,
                    category: category // Use dynamic category
                });
            }
            
            setSaveDialogOpen(false);
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

    if (loading) return <Layout><Box sx={{display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, justifyContent:'center', py:10}}><CircularProgress/></Box></Layout>;

    return (
        <Layout>
            {!canEdit && (
                <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    You can view this template but only a Super Admin, Company Admin, or Supervisor can edit or save it. Use a site pack link to fill this form for a site.
                </Alert>
            )}

            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => siteId ? navigate('/sitepack-management', { state: { siteId, moduleTitle: category } }) : navigate('/general-forms')} sx={{ bgcolor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <ArrowLeft size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                        Tool Box Talk Register
                    </Typography>
                </Box>
                <Button 
                    variant="contained" 
                    onClick={handleSaveClick}
                    disabled={saving || !canEdit || downloading}
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

            <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, justifyContent: 'center', mb: 8, overflowX: "auto", px: { xs: 2, md: 0 } }}>
                {/* Form Container */}
                <Paper 
                    ref={containerRef}
                    elevation={3} 
                    sx={{ 
                        width: "100%", 
                        minWidth: pdfLayout ? "1000px" : "100%",
                        maxWidth: "1000px", 
                        p: 4, 
                        bgcolor: isDarkMode ? "#1B212C" : "#FFFFFF", 
                        color: isDarkMode ? "#F9FAFB" : "#111827",
                        borderRadius: 2,
                        border: pdfLayout ? "1px solid #ccc" : "none",
                        boxShadow: pdfLayout ? "none" : undefined
                    }}
                >
                    {/* Top Header Logos and Document Info */}
                    <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, border: `1px solid ${borderColor}`, mb: 4 }}>
                        {/* Left Logo / Upload */}
                        <Box sx={{ width: { xs: '100%', md: '30%' }, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                            {docInfo.logo ? (
                                <>
                                    <Box component="img" src={docInfo.logo} alt="Uploaded Logo" sx={{ width: { xs: '100%', md: '80%' }, maxHeight: '100px', objectFit: 'contain', mb: !contentReadOnly ? 1 : 0 }} />
                                    {!contentReadOnly && (
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Button variant="text" size="small" component="label" sx={{ fontSize: '0.7rem' }}>
                                                Change Logo
                                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setDocInfo({...docInfo, logo: ev.target.result});
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </Button>
                                            <Button variant="text" color="error" size="small" sx={{ fontSize: '0.7rem' }} onClick={() => setDocInfo({...docInfo, logo: ''})}>
                                                Remove
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                !contentReadOnly ? (
                                    <Button variant="outlined" component="label" size="small">
                                        Upload Logo
                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setDocInfo({...docInfo, logoRight: ev.target.result});
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </Button>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">No Logo</Typography>
                                )
                            )}
                        </Box>
                        
                        {/* Center Info */}
                        <Box sx={{ width: { xs: '100%', md: '40%' }, display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                            <Box sx={{ flex: 1, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                                {(contentReadOnly) ? (
                                    <Typography sx={{ fontWeight: 'bold' }}>{headerLabels.formTitle}</Typography>
                                ) : (
                                    <TextField
                                        fullWidth
                                        variant="standard"
                                        InputProps={{ disableUnderline: true, sx: { fontWeight: 'bold', textAlign: 'center', input: { textAlign: 'center' } } }}
                                        value={headerLabels.formTitle}
                                        onChange={(e) => setHeaderLabels({...headerLabels, formTitle: e.target.value})}
                                    />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: { xs: '100%', md: '60%' }, p: 1, borderRight: `1px solid ${borderColor}` }}>
                                    {(contentReadOnly) ? (
                                        <Typography sx={{ fontWeight: 'inherit' }}>{headerLabels.dateLabel}</Typography>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            InputProps={{ disableUnderline: true, sx: { fontWeight: 'inherit' } }}
                                            value={headerLabels.dateLabel}
                                            onChange={(e) => setHeaderLabels({...headerLabels, dateLabel: e.target.value})}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '40%' }, p: 0 }}>
                                    {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{docInfo.date || ' '}</Typography>) : (<TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 1, py: 1, height: '100%' } }} value={docInfo.date} onChange={e => setDocInfo({...docInfo, date: e.target.value})} />)}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: { xs: '100%', md: '60%' }, p: 1, borderRight: `1px solid ${borderColor}` }}>
                                    {(contentReadOnly) ? (
                                        <Typography sx={{ fontWeight: 'inherit' }}>{headerLabels.docNoLabel}</Typography>
                                    ) : (
                                        <TextField
                                            fullWidth
                                            variant="standard"
                                            InputProps={{ disableUnderline: true, sx: { fontWeight: 'inherit' } }}
                                            value={headerLabels.docNoLabel}
                                            onChange={(e) => setHeaderLabels({...headerLabels, docNoLabel: e.target.value})}
                                        />
                                    )}
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '40%' }, p: 0 }}>
                                    {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{docInfo.docNo || ' '}</Typography>) : (<TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 1, py: 1, height: '100%' } }} value={docInfo.docNo} onChange={e => setDocInfo({...docInfo, docNo: e.target.value})} />)}
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                <Box sx={{ width: { xs: '100%', md: '60%' }, p: 0, borderRight: `1px solid ${borderColor}`, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center' }}>
                                    <Box sx={{ pl: 1, pr: 0.5, whiteSpace: 'nowrap' }}>
                                        {(contentReadOnly) ? (
                                            <Typography sx={{ fontWeight: 'inherit' }}>{headerLabels.approvedByLabel}</Typography>
                                        ) : (
                                            <TextField
                                                variant="standard"
                                                InputProps={{ disableUnderline: true, sx: { fontWeight: 'inherit', maxWidth: '100px' } }}
                                                value={headerLabels.approvedByLabel}
                                                onChange={(e) => setHeaderLabels({...headerLabels, approvedByLabel: e.target.value})}
                                            />
                                        )}
                                    </Box>
                                    {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{docInfo.approvedBy || ' '}</Typography>) : (<TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: headerTextColor, px: 0.5, py: 1, height: '100%' } }} value={docInfo.approvedBy} onChange={e => setDocInfo({...docInfo, approvedBy: e.target.value})} />)}
                                </Box>
                            </Box>
                        </Box>

                        {/* Right Logo / Upload */}
                        <Box sx={{ width: { xs: '100%', md: '30%' }, p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                            {docInfo.logoRight ? (
                                <>
                                    <Box component="img" src={docInfo.logoRight} alt="Uploaded Logo" sx={{ width: { xs: '100%', md: '80%' }, maxHeight: '100px', objectFit: 'contain', mb: !contentReadOnly ? 1 : 0 }} />
                                    {!contentReadOnly && (
                                        <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                                            <Button variant="text" size="small" component="label" sx={{ fontSize: '0.7rem' }}>
                                                Change Logo
                                                <input type="file" hidden accept="image/*" onChange={(e) => {
                                                    const file = e.target.files[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onload = (ev) => setDocInfo({...docInfo, logoRight: ev.target.result});
                                                        reader.readAsDataURL(file);
                                                    }
                                                }} />
                                            </Button>
                                            <Button variant="text" color="error" size="small" sx={{ fontSize: '0.7rem' }} onClick={() => setDocInfo({...docInfo, logoRight: ''})}>
                                                Remove
                                            </Button>
                                        </Box>
                                    )}
                                </>
                            ) : (
                                !contentReadOnly ? (
                                    <Button variant="outlined" component="label" size="small">
                                        Upload Logo
                                        <input type="file" hidden accept="image/*" onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onload = (ev) => setDocInfo({...docInfo, logoRight: ev.target.result});
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                    </Button>
                                ) : (
                                    <Typography variant="caption" color="text.secondary">No Logo</Typography>
                                )
                            )}
                        </Box>
                    </Box>

                    {/* Presenter Info Details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', border: `1px solid ${borderColor}` }}>
                        {[
                            { key: "presenter" },
                            { key: "date" },
                            { key: "site" },
                            { key: "topic" }
                        ].map((row, index) => (
                            <Box key={row.key} sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, borderBottom: index < 3 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: { xs: '100%', md: '40%' }, p: 0, fontWeight: 'bold', borderRight: `1px solid ${borderColor}`, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center' }}>
                                    {(contentReadOnly) ? 
                                        (<Typography sx={{ p: cellPadding, fontWeight: 'bold' }}>{headerLabels[row.key]}</Typography>) : 
                                        (<TextField 
                                            fullWidth 
                                            variant="standard" 
                                            InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", p: cellPadding, fontWeight: 'bold' } }}
                                            value={headerLabels[row.key]}
                                            onChange={(e) => setHeaderLabels({...headerLabels, [row.key]: e.target.value})}
                                        />)
                                    }
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '60%' }, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' } }}>
                                        {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{headerData[row.key] || ' '}</Typography>) : (<TextField multiline 
                                        fullWidth 
                                        variant="standard" 
                                        InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", p: cellPadding } }}
                                        value={headerData[row.key]}
                                        onChange={handleHeaderChange(row.key)}
                                    />)}
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
                        <Box sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, borderBottom: `1px solid ${borderColor}` }}>
                            <Box sx={{ width: { xs: '100%', md: (contentReadOnly) ? '5%' : '88px' }, minWidth: { md: (contentReadOnly) ? undefined : '88px' }, p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>#</Box>
                            <Box sx={{ width: { xs: '100%', md: '35%' }, p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>Print Name</Box>
                            <Box sx={{ width: { xs: '100%', md: '35%' }, p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}` }}>Signature</Box>
                            <Box sx={{ width: { xs: '100%', md: '25%' }, p: cellPadding, textAlign: 'center' }}>Date</Box>
                        </Box>
                        
                        {attendees.map((attendee, index) => (
                            <Box key={index} sx={{ display: 'flex', flexWrap: { xs: 'wrap', md: 'nowrap' }, borderBottom: index < attendees.length - 1 ? `1px solid ${borderColor}` : 'none' }}>
                                <Box sx={{ width: { xs: '100%', md: (contentReadOnly) ? '5%' : '88px' }, minWidth: { md: (contentReadOnly) ? undefined : '88px' }, p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.25 }}>
                                    <Typography sx={{ fontWeight: 'bold', lineHeight: 1 }}>{index + 1}</Typography>
                                    <GeneralFormTableRowControls
                                        downloading={downloading}
                                        action={action}
                                        accessLocked={!canEdit}
                                        rowIndex={index}
                                        rowCount={attendees.length}
                                        minRows={1}
                                        maxRows={35}
                                        borderColor={borderColor}
                                        onInsertAfter={insertAttendeeAfter}
                                        onRemoveAt={removeAttendeeAt}
                                        variant="compact"
                                    />
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '35%' }, borderRight: `1px solid ${borderColor}` }}>
                                    {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{attendee.printName || ' '}</Typography>) : (<TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, height: '100%' } }} value={attendee.printName} onChange={handleAttendeeChange(index, "printName")} />)}
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '35%' }, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                                    {attendee.signature && (attendee.signature.startsWith('data:image/') || attendee.signature.startsWith('http')) ? (
                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', py: 0.5 }}>
                                            <Box component="img" src={attendee.signature} alt="Signature" sx={{ maxHeight: '40px', maxWidth: '100%', objectFit: 'contain' }} />
                                            {!(contentReadOnly) && (
                                                <Button size="small" color="error" sx={{ fontSize: '0.65rem', minWidth: 'auto', p: 0, mt: 0.5 }} onClick={() => {
                                                    const newAttendees = attendees.map((att, i) => i === index ? { ...att, signature: '' } : att);
                                                    setAttendees(newAttendees);
                                                }}>Remove</Button>
                                            )}
                                        </Box>
                                    ) : (
                                        (contentReadOnly) ? (
                                            <Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit', flex: 1 }}>{attendee.signature || ' '}</Typography>
                                        ) : (
                                            <Box sx={{ width: '100%', px: 0.5, py: 0.5 }}>
                                                <SignatureCapture
                                                    value={
                                                        attendee.signature &&
                                                        (attendee.signature.startsWith('data:image/') || attendee.signature.startsWith('http'))
                                                            ? attendee.signature
                                                            : null
                                                    }
                                                    onChange={(url) => {
                                                        const newAttendees = attendees.map((att, i) =>
                                                            i === index ? { ...att, signature: url || '' } : att
                                                        );
                                                        setAttendees(newAttendees);
                                                    }}
                                                    readOnly={contentReadOnly}
                                                    compact
                                                />
                                            </Box>
                                        )
                                    )}
                                </Box>
                                <Box sx={{ width: { xs: '100%', md: '25%' } }}>
                                    {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{attendee.date || ' '}</Typography>) : (<TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 1, height: '100%' } }} value={attendee.date} onChange={handleAttendeeChange(index, "date")} />)}
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
                        {(contentReadOnly) ? (<Typography sx={{ whiteSpace: 'pre-wrap', wordBreak: 'break-all', px: 1, py: 1, minHeight: '1.5em', textAlign: 'inherit' }}>{consultation || ' '}</Typography>) : (<TextField 
                            fullWidth 
                            multiline 
                            minRows={4} 
                            variant="standard" 
                            InputProps={{ disableUnderline: true, sx: { color: isDarkMode ? "#F9FAFB" : "#111827", px: 2, pb: 2, pt: 0 } }}
                            value={consultation}
                            onChange={(e) => setConsultation(e.target.value)}
                        />)}
                    </Box>

                                        {/* Signature Section */}
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 6, mb: 2 }}>
                            <Box sx={{ width: '250px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <Box sx={{ width: '100%', borderBottom: `1px solid ${borderColor}`, mb: 1, pb: 1 }}>
                                    <SignatureCapture
                                        value={docInfo.signature || null}
                                        onChange={(url) => setDocInfo({ ...docInfo, signature: url || "" })}
                                        readOnly={contentReadOnly}
                                    />
                                </Box>
                                <Typography sx={{ fontWeight: 'bold', fontSize: '0.9rem' }}>Signature</Typography>
                            </Box>
                        </Box>

                    </Paper>
            </Box>

            <SaveChoiceDialog
                open={saveDialogOpen}
                onClose={() => setSaveDialogOpen(false)}
                onSave={executeSave}
                existingId={persistedResponseId}
                defaultName={formMetadata.name || `Tool Box Talk - ${new Date().toLocaleDateString()}`}
                defaultTags={formMetadata.tags}
                saving={saving}
                templateFlow
                nameFieldLabel="Template name"
            />
        </Layout>
    );
}
