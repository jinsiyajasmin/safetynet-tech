import React, { useState, useEffect, useRef } from "react";
import { Box, Typography, Button, Paper, TextField, CircularProgress, IconButton } from "@mui/material";
import { ArrowLeft } from "lucide-react";
import Layout from "../components/Layout";
import { useTheme } from "../context/ThemeContext";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import api from "../services/api";
import { getOrCreateTemplateForm } from "../services/formUtils";
import { downloadPdfFromRef } from "../utils/pdfGenerator";

export default function SiteInductionRecordForm() {
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
        // Section A
        nameOfSite: "",
        locationAddress: "",
        sectionADate: "",
        
        // Section B
        fullName: "",
        jobTitle: "",
        companyName: "",
        orgProcedures: "",

        // Section C
        cscs: false,
        asbestosAwareness: false,
        firstAid: false,
        healthSafety: false,
        smsts: false,
        otherSkills: "",
        cardNumber: "",
        expiryDate: "",
        isFirstAider: "",
        isBelowHookTrained: "",

        // Section D
        emergencyContactName: "",
        relationship: "",
        contactNumber: "",
        asthma: false,
        heartCondition: false,
        diabetic: false,
        epilepsy: false,
        hearingLoss: false,
        otherMedical: "",
        
        // Section E (Works)
        briefedOnRAMS: "",

        // Section F (Arrangements Map - index -> "Yes" | "No" | "N/A")
        arrangements: {},

        // Open Discussion
        openDiscussion: "",

        // Section E (Confirmation)
        inducteePrintName: "",
        inducteeSignature: "",
        inductorPrintName: "",
        inductorSignature: ""
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
                downloadPdfFromRef(containerRef, `SiteInductionForm_${id}`, () => {
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
                    if (submission.answers.formData) setFormData({...formData, ...submission.answers.formData});
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
                const formId = await getOrCreateTemplateForm("Site Induction Form");
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

    const toggleCheckbox = (field) => () => {
        setFormData({ ...formData, [field]: !formData[field] });
    };

    const updateArrangement = (index, val) => {
        setFormData(prev => ({
            ...prev,
            arrangements: {
                ...prev.arrangements,
                [index]: val
            }
        }));
    };

    const ARRANGEMENTS_PAGE_2 = [
        "Detail the scope of the project",
        "Key members of the 'Site Management Team' (including Fire Marshals | First Aiders | Contact Telephone)",
        "Training and Competence (current registration card e.g. CSCS, CSCS Affiliated Schemes (or equivalent)",
        "Covid – 19 Precautions | Control Measures etc.",
        "Traffic management & Storage arrangements explained (boundaries, routes, security procedures etc)",
        "Location of the welfare facilities",
        "Methods of consultation and communication (method statements, toolbox talks etc)",
        "Actions to be taken in the event of accident, incident or near miss (including reporting & investigation)",
        "Name(s) of the site first aider(s) and facilities available, along with location",
        "Fire & Emergency procedures (escape route, assembly points, how to raise Alarm, Fire Prevention etc)",
        "Location of fire alarms and fire extinguishers.",
        "Smoking restrictions and if relevant the designated area",
        "Site rules explained (e.g. Drugs & alcohol, no radios, no horse play,",
        "Minimum PPE requirements (including task specific PPE)",
        "Permit procedures (Hot works | Permit to Work | other)",
        "Housekeeping and waste segregation",
        "Compliance with company IMS procedures where appropriate (including SHEQ Policies)",
        "Welfare Facilities (Changing rooms | Canteen | Toilets etc)",
        "Safe use of plant and equipment",
        "Working at Heights",
        "Safe use of scaffolding, mobile towers etc (scaff-tag system / inspections)",
        "Control of Substances Hazardous to Health",
        "Control of Vibration",
        "Control of Noise",
        "Electrical Safety (including PAT)",
        "Lifting Equipment and accessories (12monthly and 6monthly Thorough Examinations | Sling protection etc.)",
        "Manual Handling",
        "Slips, Trips and falls | Control of Site Visitors",
        { header: "Site specific information which was raised within the pre-construction information pack:" },
        "Asbestos",
        "Occupied Building (live site working restrictions)",
        "End use and client's requirements",
        "Restricted or prohibited areas | Buried services | Underground services",
        "", // Blank row
        { header: "Environment information known or raised within the pre-construction information pack:" },
        "Noise Restrictions",
        "Waste Management"
    ];

    const ARRANGEMENTS_PAGE_3 = [
        "Hydraulic Oil (storage)",
        "Spillage Management",
        "", // Blank row
    ];

    const borderColor = isDarkMode ? "#374151" : "#CCC";
    const headerBgColor = isDarkMode ? "rgba(255,255,255,0.05)" : "#E5E7EB";
    const textColor = isDarkMode ? "#F9FAFB" : "#111827";
    const cellPadding = "4px 8px";

    const renderHeader = (pageNum) => (
        <Box sx={{ display: 'flex', border: `1px solid ${borderColor}`, mb: 2 }}>
            <Box sx={{ width: '30%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRight: `1px solid ${borderColor}` }}>
                <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
            </Box>
            
            <Box sx={{ width: '40%', display: 'flex', flexDirection: 'column', borderRight: `1px solid ${borderColor}` }}>
                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', p: 1, borderBottom: `1px solid ${borderColor}` }}>
                    SITE INDUCTION FORM
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
                    <Box sx={{ width: '40%', p: 1 }}>Page {pageNum} of 3</Box>
                </Box>
            </Box>

            <Box sx={{ width: '30%', p: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Box component="img" src="/Logo02.png" alt="Construct Lifts" sx={{ width: '80%', objectFit: 'contain' }} />
            </Box>
        </Box>
    );

    const renderCheckboxBox = (label, onToggle, isChecked) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {label}
            <Box 
                onClick={onToggle}
                sx={{ 
                    width: 14, height: 14, 
                    border: `1px solid ${borderColor}`,
                    bgcolor: isChecked ? '#666' : 'transparent',
                    cursor: 'pointer'
                }} 
            />
        </Box>
    );

    const renderRadioRow = (label, valueField) => (
        <Box sx={{ display: 'flex', bgcolor: headerBgColor }}>
            <Box sx={{ width: '60%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                {label}
            </Box>
            <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', justifyContent: 'space-between' }}>
                Yes
                <Box onClick={() => setFormData({...formData, [valueField]: "Yes"})} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData[valueField] === "Yes" ? '#666' : 'transparent', cursor: 'pointer' }} />
            </Box>
            <Box sx={{ width: '20%', p: cellPadding, display: 'flex', justifyContent: 'space-between' }}>
                No
                <Box onClick={() => setFormData({...formData, [valueField]: "No"})} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData[valueField] === "No" ? '#666' : 'transparent', cursor: 'pointer' }} />
            </Box>
        </Box>
    );

    const renderArrangementRow = (item, baseIndex) => {
        if (typeof item === 'object' && item.header) {
            return (
                <Box key={`arr-head-${baseIndex}`} sx={{ p: cellPadding, borderBottom: `1px solid ${borderColor}`, borderTop: `1px solid ${borderColor}` }}>
                    {item.header}
                </Box>
            );
        }

        return (
            <Box key={`arr-${baseIndex}`} sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                <Box sx={{ width: '70%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center' }}>
                    {item}
                </Box>
                <Box sx={{ width: '10%', p: cellPadding, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${borderColor}` }}>
                    <Box onClick={() => updateArrangement(baseIndex, "Yes")} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.arrangements[baseIndex] === "Yes" ? '#666' : 'transparent', cursor: 'pointer' }} />
                </Box>
                <Box sx={{ width: '10%', p: cellPadding, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: `1px solid ${borderColor}` }}>
                    <Box onClick={() => updateArrangement(baseIndex, "No")} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.arrangements[baseIndex] === "No" ? '#666' : 'transparent', cursor: 'pointer' }} />
                </Box>
                <Box sx={{ width: '10%', p: cellPadding, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Box onClick={() => updateArrangement(baseIndex, "N/A")} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.arrangements[baseIndex] === "N/A" ? '#666' : 'transparent', cursor: 'pointer' }} />
                </Box>
            </Box>
        );
    };

    if (loading) return <Layout><Box sx={{display:'flex', justifyContent:'center', py:10}}><CircularProgress/></Box></Layout>;

    return (
        <Layout>
            <Box sx={{ mb: 4, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <IconButton onClick={() => siteId ? navigate('/sitepack-management', { state: { siteId, moduleTitle: category } }) : navigate('/general-forms')} sx={{ bgcolor: isDarkMode ? '#374151' : '#E5E7EB' }}>
                        <ArrowLeft size={20} color={isDarkMode ? '#F9FAFB' : '#111827'} />
                    </IconButton>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: isDarkMode ? "#F9FAFB" : "#111827" }}>
                        Site Induction Form
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
                    <Box sx={{ mb: 6 }}>
                        {renderHeader(1)}
                        
                        {/* Section A */}
                        <Box sx={{ border: `1px solid ${borderColor}`, mb: 2 }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold' }}>Section A: Details</Box>
                            <Box sx={{ display: 'flex', borderTop: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Name of Site</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.nameOfSite} onChange={updateField("nameOfSite")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderTop: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Location / Address</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.locationAddress} onChange={updateField("locationAddress")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderTop: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Date</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.sectionADate} onChange={updateField("sectionADate")} />
                                </Box>
                            </Box>
                        </Box>

                        {/* Section B */}
                        <Box sx={{ border: `1px solid ${borderColor}`, mb: 2 }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>Section B: Who is being inducted</Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Full Name:</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.fullName} onChange={updateField("fullName")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Job Title:</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.jobTitle} onChange={updateField("jobTitle")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    Company Name:<br/>
                                    <Typography variant="caption">(If Subcontractor)</Typography>
                                </Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={formData.companyName} onChange={updateField("companyName")} />
                                </Box>
                            </Box>
                            <Box sx={{ borderBottom: `1px solid ${borderColor}`, bgcolor: headerBgColor }}>
                                <Typography variant="caption" sx={{ px: 1 }}>(or if you are self-employed working under another organisations procedures)</Typography>
                            </Box>
                            <Box sx={{ p: 0 }}>
                                <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.orgProcedures} onChange={updateField("orgProcedures")} />
                            </Box>
                        </Box>

                        {/* Section C */}
                        <Box sx={{ border: `1px solid ${borderColor}`, mb: 2 }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>Section C: Skills and Knowledge – <span style={{fontWeight:'normal'}}>(tick relevant card type (s))</span></Box>
                            
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    {renderCheckboxBox("CSCS", toggleCheckbox("cscs"), formData.cscs)}
                                </Box>
                                <Box sx={{ flex: 1.5, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Box>Asbestos<br/>Awareness</Box>
                                        <Box onClick={toggleCheckbox("asbestosAwareness")} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.asbestosAwareness ? '#666' : 'transparent', cursor: 'pointer' }} />
                                    </Box>
                                </Box>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    {renderCheckboxBox("First Aid", toggleCheckbox("firstAid"), formData.firstAid)}
                                </Box>
                                <Box sx={{ flex: 1.5, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    {renderCheckboxBox("Health & Safety", toggleCheckbox("healthSafety"), formData.healthSafety)}
                                </Box>
                                <Box sx={{ flex: 2, p: cellPadding, display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Box>SMSTS or equivalent<br/><Typography variant="caption">– Please state below</Typography></Box>
                                    <Box onClick={toggleCheckbox("smsts")} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.smsts ? '#666' : 'transparent', cursor: 'pointer' }} />
                                </Box>
                            </Box>
                            
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ p: cellPadding, width: '10%' }}>Other</Box>
                                <Box sx={{ p: 0, width: '90%' }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.otherSkills} onChange={updateField("otherSkills")} />
                                </Box>
                            </Box>

                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '25%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Card Number:</Box>
                                <Box sx={{ width: '35%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.cardNumber} onChange={updateField("cardNumber")} />
                                </Box>
                                <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Expiry Date:</Box>
                                <Box sx={{ width: '20%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.expiryDate} onChange={updateField("expiryDate")} />
                                </Box>
                            </Box>

                            {renderRadioRow("Are you first aider / Appointed Person?", "isFirstAider")}
                            <Box sx={{ borderTop: `1px solid ${borderColor}` }}>
                                {renderRadioRow("Are you Below Hook – Lifting Operations trained?", "isBelowHookTrained")}
                            </Box>
                        </Box>

                        {/* Section D */}
                        <Box sx={{ border: `1px solid ${borderColor}`, mb: 2 }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>Section D: Emergency Information</Box>
                            
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Emergency Contact<br/>Name:</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={formData.emergencyContactName} onChange={updateField("emergencyContactName")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Relationship:</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.relationship} onChange={updateField("relationship")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Contact Number:</Box>
                                <Box sx={{ width: '70%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.contactNumber} onChange={updateField("contactNumber")} />
                                </Box>
                            </Box>

                            <Box sx={{ p: cellPadding, borderBottom: `1px solid ${borderColor}` }}>
                                Do you have any medical condition that our First Aider or Site Supervisors should be made aware of?
                            </Box>
                            
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>{renderCheckboxBox("Asthma", toggleCheckbox("asthma"), formData.asthma)}</Box>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>{renderCheckboxBox("Heart Condition", toggleCheckbox("heartCondition"), formData.heartCondition)}</Box>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>{renderCheckboxBox("Diabetic", toggleCheckbox("diabetic"), formData.diabetic)}</Box>
                                <Box sx={{ flex: 1, p: cellPadding, borderRight: `1px solid ${borderColor}` }}>{renderCheckboxBox("Epilepsy", toggleCheckbox("epilepsy"), formData.epilepsy)}</Box>
                                <Box sx={{ flex: 1, p: cellPadding }}>{renderCheckboxBox("Hearing Loss", toggleCheckbox("hearingLoss"), formData.hearingLoss)}</Box>
                            </Box>

                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '25%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>Other <Typography variant="caption">– Please State</Typography></Box>
                                <Box sx={{ width: '75%', p: 0 }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, py: 0.5 } }} value={formData.otherMedical} onChange={updateField("otherMedical")} />
                                </Box>
                            </Box>
                            
                            <Box sx={{ p: cellPadding, fontSize: '0.8rem' }}>
                                This information is not mandatory. However, providing it will ensure you receive prompt and appropriate treatment whilst working on our site.
                            </Box>
                        </Box>

                        {/* Section E (1) */}
                        <Box sx={{ border: `1px solid ${borderColor}` }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>Section E: Works Briefing</Box>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>Project Management</Box>
                            <Box sx={{ p: cellPadding, borderBottom: `1px solid ${borderColor}` }}>
                                The Risk Assessments and Method Statements including COSHH briefing MUST be conducted as part of Induction.
                            </Box>
                            
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '60%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    Have you been briefed on the RAMS and Lift Plans?
                                </Box>
                                <Box sx={{ width: '20%', p: cellPadding, borderRight: `1px solid ${borderColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    Yes
                                    <Box onClick={() => setFormData({...formData, briefedOnRAMS: "Yes"})} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.briefedOnRAMS === "Yes" ? '#666' : 'transparent', cursor: 'pointer' }} />
                                </Box>
                                <Box sx={{ width: '20%', p: cellPadding, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                    No
                                    <Box onClick={() => setFormData({...formData, briefedOnRAMS: "No"})} sx={{ width: 14, height: 14, border: `1px solid ${borderColor}`, bgcolor: formData.briefedOnRAMS === "No" ? '#666' : 'transparent', cursor: 'pointer' }} />
                                </Box>
                            </Box>
                        </Box>
                    </Box>

                    {/* PAGE 2 */}
                    <Box sx={{ minHeight: '1100px', mb: 6 }}>
                        {renderHeader(2)}

                        <Box sx={{ border: `1px solid ${borderColor}`, borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ borderBottom: `1px solid ${borderColor}`, p: 1 }}>
                                (Particular risks and control measures | Ongoing Briefings | )
                            </Box>

                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '70%', p: cellPadding, borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>
                                    Section F: Arrangements – Tick the relevant Topics discussed that are applicable during the Induction Training.
                                </Box>
                                <Box sx={{ width: '10%', p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>Yes</Box>
                                <Box sx={{ width: '10%', p: cellPadding, textAlign: 'center', borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>No</Box>
                                <Box sx={{ width: '10%', p: cellPadding, textAlign: 'center', fontWeight: 'bold' }}>N/A</Box>
                            </Box>

                            {ARRANGEMENTS_PAGE_2.map((item, index) => renderArrangementRow(item, index))}
                        </Box>
                    </Box>

                    {/* PAGE 3 */}
                    <Box sx={{ minHeight: '1100px' }}>
                        {renderHeader(3)}

                        <Box sx={{ border: `1px solid ${borderColor}`, borderBottom: 'none' }}>
                            {ARRANGEMENTS_PAGE_3.map((item, index) => renderArrangementRow(item, index + ARRANGEMENTS_PAGE_2.length))}
                        </Box>

                        <Box sx={{ border: `1px solid ${borderColor}`, mb: 4 }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>
                                Open discussion – highlight other areas raised by the inductee:
                                <Typography variant="caption" display="block" sx={{ fontWeight: 'normal' }}>All sufficient changes or updates along with continuous control will be managed in the form of ‘toolbox talks’ and ‘meetings’.</Typography>
                            </Box>
                            <Box sx={{ p: 1, minHeight: '100px' }}>
                                <TextField fullWidth multiline minRows={3} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor } }} value={formData.openDiscussion} onChange={updateField("openDiscussion")} />
                            </Box>
                        </Box>

                        <Box sx={{ border: `1px solid ${borderColor}` }}>
                            <Box sx={{ p: cellPadding, fontWeight: 'bold', borderBottom: `1px solid ${borderColor}` }}>
                                Section E: Confirmation of induction – I understand all the information and instruction given in this induction
                            </Box>
                            <Box sx={{ display: 'flex', borderBottom: `1px solid ${borderColor}` }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>Print Name:</Typography>
                                    <Typography>(Inductee)</Typography>
                                </Box>
                                <Box sx={{ width: '30%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={formData.inducteePrintName} onChange={updateField("inducteePrintName")} />
                                </Box>
                                <Box sx={{ width: '15%', p: cellPadding, borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>Signature:</Box>
                                <Box sx={{ width: '25%', p: 0 }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1 } }} value={formData.inducteeSignature} onChange={updateField("inducteeSignature")} />
                                </Box>
                            </Box>
                            <Box sx={{ display: 'flex' }}>
                                <Box sx={{ width: '30%', p: cellPadding, borderRight: `1px solid ${borderColor}` }}>
                                    <Typography sx={{ fontWeight: 'bold' }}>Print Name:</Typography>
                                    <Typography>(Inductor)</Typography>
                                </Box>
                                <Box sx={{ width: '30%', p: 0, borderRight: `1px solid ${borderColor}` }}>
                                    <TextField fullWidth multiline variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1, height: '100%' } }} value={formData.inductorPrintName} onChange={updateField("inductorPrintName")} />
                                </Box>
                                <Box sx={{ width: '15%', p: cellPadding, borderRight: `1px solid ${borderColor}`, fontWeight: 'bold' }}>Signature:</Box>
                                <Box sx={{ width: '25%', p: 0 }}>
                                    <TextField fullWidth multiline minRows={2} variant="standard" InputProps={{ disableUnderline: true, sx: { color: textColor, px: 1 } }} value={formData.inductorSignature} onChange={updateField("inductorSignature")} />
                                </Box>
                            </Box>
                        </Box>
                        
                        <Box sx={{ mt: 4, pl: 2, fontWeight: 'bold', fontSize: '1.1rem' }}>
                            Retain with project papers
                        </Box>
                    </Box>

                </Paper>
            </Box>
        </Layout>
    );
}
