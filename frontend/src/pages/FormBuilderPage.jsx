// src/pages/FormBuilderPage.jsx
import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  Select,
  Tooltip,
  Checkbox,
  Radio,
  FormControlLabel,
  RadioGroup,
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import EventIcon from "@mui/icons-material/Event";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SmartphoneIcon from "@mui/icons-material/Smartphone";
import LaptopMacIcon from "@mui/icons-material/LaptopMac";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

import FormatAlignLeftIcon from "@mui/icons-material/FormatAlignLeft";
import FormatAlignCenterIcon from "@mui/icons-material/FormatAlignCenter";
import FormatAlignRightIcon from "@mui/icons-material/FormatAlignRight";
import Popover from "@mui/material/Popover";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";


import TopNav from "../components/TopNav";
import Sidebar from "../components/Sidebar";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

import api from "../services/api";


const IconSvg = ({ name, size = 15, color = "warning.main" }) => {
  const lightGreen = "#22c55e";
  const blue = "#2563eb";

  const muiIcons = {
    Date: <CalendarTodayIcon sx={{ fontSize: size, color }} />,
    Time: <AccessTimeIcon sx={{ fontSize: size, color }} />,
    DateTime: <EventIcon sx={{ fontSize: size, color }} />,
    MonthYear: <EventAvailableIcon sx={{ fontSize: size, color }} />,
    FileUpload: (
      <FileUploadOutlinedIcon sx={{ fontSize: size, color: lightGreen }} />
    ),
    Save: <SaveOutlinedIcon sx={{ fontSize: size, color: "white" }} />,
    Eye: <VisibilityOutlinedIcon sx={{ fontSize: size, color: blue }} />,
  };

  if (muiIcons[name]) return muiIcons[name];

  const iconMap = {
    TextSingle: "singleline.svg",
    TextMulti: "multiline.svg",
    Dropdown: "dropdown.svg",
    Radio: "/radio.svg",
    Checkbox: "checkbox.svg",
    ExampleUploadedPNG: "/mnt/data/30687653-be1f-4880-b3f3-4221e812f970.png",
  };

  const src = iconMap[name] || iconMap.ExampleUploadedPNG;



  return (
    <img
      src={src}
      alt={name}
      width={size}
      height={size}
      style={{ objectFit: "contain", display: "block" }}
    />
  );
};

const uid = () => Math.random().toString(36).slice(2, 9);


const TOOLBOX_CATEGORIES = [

  {
    title: "Textbox",
    items: [
      { type: "text", label: "Single Line", icon: "TextSingle" },
      { type: "textarea", label: "Multi Line", icon: "TextMulti" },
    ],
  },
  {
    title: "Choices",
    items: [
      { type: "select", label: "Dropdown", icon: "Dropdown" },
      { type: "radio", label: "Radio", icon: "Radio" },
      { type: "checkbox", label: "Checkbox", icon: "Checkbox" },
    ],
  },
  {
    title: "Date & Time",
    items: [
      { type: "date", label: "Date", icon: "Date" },
      { type: "time", label: "Time", icon: "Time" },
      { type: "datetime", label: "Date-Time", icon: "DateTime" },
      { type: "monthyear", label: "Month-Year", icon: "MonthYear" },
    ],
  },
  {
    title: "Uploads",
    items: [
      { type: "file", label: "File Upload", icon: "FileUpload" },
      { type: "media", label: "Audio/Video Upload", icon: "Media" },
    ],
  },
];

const findTemplateByType = (type) => {
  for (const cat of TOOLBOX_CATEGORIES) {
    const found = cat.items.find((it) => it.type === type);
    if (found) return found;
  }
  return null;
};


function makeField(template) {
  const id = uid();
  const base = {
    id,
    type: template.type,
    label: template.label,
    name: (template.type + "_" + id)
      .replace(/[^a-z0-9_-]/gi, "")
      .toLowerCase(),
    required: false,
  };

  if (
    template.type === "select" ||
    template.type === "radio" ||
    template.type === "checkbox" ||
    template.type === "multiple" ||
    template.type === "image_choices"
  ) {
    base.options = [
      { id: uid(), label: "Option 1", value: "option_1" },
      { id: uid(), label: "Option 2", value: "option_2" },
    ];
  }

  return base;
}


export default function FormBuilderPage() {



  const [formTitle, setFormTitle] = useState(() => {
    return localStorage.getItem("formbuilder_title") || "";
  });

  const [formTitleColor, setFormTitleColor] = useState(() => {
    return localStorage.getItem("formbuilder_titleColor") || "#000000";
  });
  const [titleAlignment, setTitleAlignment] = useState(() => {
    return localStorage.getItem("formbuilder_titleAlignment") || "left";
  });
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

  // Update localStorage when title settings change
  useEffect(() => {
    localStorage.setItem("formbuilder_title", formTitle);
    localStorage.setItem("formbuilder_titleColor", formTitleColor);
    localStorage.setItem("formbuilder_titleAlignment", titleAlignment);
  }, [formTitle, formTitleColor, titleAlignment]);

  const [fields, setFields] = useState(() => {
    try {
      const saved = localStorage.getItem("formbuilder_form");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [editingField, setEditingField] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState(null);

  const [previewMode, setPreviewMode] = useState("desktop");
  const [isSaving, setIsSaving] = useState(false);

  const navigate = useNavigate();

  const [successOpen, setSuccessOpen] = useState(false);



  const [fieldValues, setFieldValues] = useState({});

  const handleRadioChange = (fieldId, value) => {
    setFieldValues((prev) => ({
      ...prev,
      [fieldId]: value,
    }));
  };

  const handleCheckboxToggle = (fieldId, optionValue) => {
    setFieldValues((prev) => {
      const current = Array.isArray(prev[fieldId]) ? prev[fieldId] : [];
      const exists = current.includes(optionValue);
      const next = exists
        ? current.filter((v) => v !== optionValue)
        : [...current, optionValue];
      return {
        ...prev,
        [fieldId]: next,
      };
    });
  };


  const saveToLocal = async () => {
    if (!fields.length) {
      alert("Add at least one field before saving.");
      return;
    }

    setIsSaving(true);
    try {
      const res = await api.post("/forms", {
        title: formTitle || "Untitled Form",
        titleColor: formTitleColor,
        titleAlignment,
        fields,
      });

      if (!res?.data?.success) {
        alert(res?.data?.message || "Failed to save form");
        return;
      }

      // ✅ Open success modal
      setSuccessOpen(true);

    } catch (err) {
      console.error("Error saving form:", err);
      alert("Something went wrong while saving the form");
    } finally {
      setIsSaving(false);
    }
  };


  const onDragEnd = (result) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId !== "canvas") return;


    if (source.droppableId.startsWith("toolbox-")) {
      const type = draggableId.replace("tool-", "");
      const template = findTemplateByType(type);
      if (!template) return;

      const newField = makeField(template);

      setFields((prev) => {
        const next = Array.from(prev);
        next.splice(destination.index, 0, newField);
        return next;
      });
      setSelectedFieldId(newField.id);
      return;
    }


    if (source.droppableId === "canvas" && destination.droppableId === "canvas") {
      if (source.index === destination.index) return;

      setFields((prev) => {
        const next = Array.from(prev);
        const [moved] = next.splice(source.index, 1);
        next.splice(destination.index, 0, moved);
        return next;
      });
    }
  };

  const openEdit = (field) => setEditingField({ ...field });
  const closeEdit = () => setEditingField(null);

  const saveEdit = () => {
    setFields((prev) =>
      prev.map((f) => (f.id === editingField.id ? editingField : f))
    );
    closeEdit();
  };

  const addOption = () => {
    const newId = uid();

    setEditingField((f) => ({
      ...f,
      options: [
        ...(f.options || []),
        {
          id: newId,
          label: "New option",
          value: `option_${newId}`,
        },
      ],
    }));
  };


  const updateOption = (optId, patch) => {
    setEditingField((f) => ({
      ...f,
      options: (f.options || []).map((o) =>
        o.id === optId ? { ...o, ...patch } : o
      ),
    }));
  };

  const removeOptionEditing = (optId) => {
    setEditingField((f) => ({
      ...f,
      options: (f.options || []).filter((o) => o.id !== optId),
    }));
  };

  // save to DB (and optionally localStorage)




  const canvasPreview = useMemo(() => fields, [fields]);

  const renderFieldInput = (f) => {
    if (f.type === "text") return <TextField fullWidth />;
    if (f.type === "textarea")
      return <TextField fullWidth multiline minRows={3} />;
    if (f.type === "date") return <TextField fullWidth type="date" />;
    if (f.type === "time") return <TextField fullWidth type="time" />;
    if (f.type === "datetime")
      return <TextField fullWidth type="datetime-local" />;
    if (f.type === "monthyear") return <TextField fullWidth type="month" />;
    if (f.type === "file") return <TextField fullWidth type="file" />;
    if (f.type === "image_upload")
      return <TextField fullWidth type="file" accept="image/*" />;

    if (f.type === "select")
      return (
        <TextField select fullWidth>
          {f.options?.map((o) => (
            <MenuItem key={o.id} value={o.value}>
              {o.label}
            </MenuItem>
          ))}
        </TextField>
      );

    if (f.type === "radio") {
      const value = fieldValues[f.id] ?? "";
      return (
        <RadioGroup
          value={value}
          onChange={(e) => handleRadioChange(f.id, e.target.value)}
        >
          {f.options?.map((o) => (
            <FormControlLabel
              key={o.id}
              value={o.value}
              control={
                <Radio
                  sx={{
                    "& .MuiSvgIcon-root": {
                      fontSize: 22,
                    },
                  }}
                />
              }
              label={o.label}
            />
          ))}
        </RadioGroup>
      );
    }

    if (f.type === "checkbox") {
      const selected = Array.isArray(fieldValues[f.id])
        ? fieldValues[f.id]
        : [];
      return (
        <Box>
          {f.options?.map((o) => (
            <FormControlLabel
              key={o.id}
              control={
                <Checkbox
                  checked={selected.includes(o.value)}
                  onChange={() => handleCheckboxToggle(f.id, o.value)}
                  sx={{
                    "& .MuiSvgIcon-root": {
                      fontSize: 20,
                    },
                  }}
                />
              }
              label={o.label}
            />
          ))}
        </Box>
      );
    }

    if (f.type === "multiple")
      return (
        <Typography sx={{ fontSize: 14 }}>
          Multiple choice preview
        </Typography>
      );

    if (f.type === "image_choices")
      return (
        <Typography sx={{ fontSize: 14 }}>
          Image choices preview
        </Typography>
      );

    return null;
  };

  return (
    <>
      <TopNav />

      <Box sx={{ display: "flex", bgcolor: "#fff" }}>
        {/* Left sidebar */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, md: 260 },
            position: "sticky",
            top: "64px",
            height: "calc(100vh - 64px)",
          }}
        >
          <Sidebar />
        </Box>

        {/* Main content */}
        <Container maxWidth="xl" sx={{ py: 4, position: "relative" }}>
          {/* Sticky header */}
          <Box
            sx={{
              position: "sticky",
              top: 64,
              zIndex: 10,
              bgcolor: "#fff",
              pb: 2,
              mb: 2,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Form Builder
              </Typography>

              <Box display="flex" gap={1}>
                <Button
                  variant="outlined"
                  startIcon={<IconSvg name="Eye" color="#2563eb" />}
                  sx={{
                    borderRadius: 2,
                    border: "1px solid #cbd5e1",
                    textTransform: "none",
                  }}
                  onClick={() => {
                    setPreviewMode("desktop");
                    setPreviewOpen(true);
                  }}
                >
                  Preview
                </Button>

                <Button
                  variant="contained"
                  startIcon={<IconSvg name="Save" color="#fff" />}
                  sx={{
                    borderRadius: 2,
                    textTransform: "none",
                    backgroundColor: "#2563eb",
                    "&:hover": { backgroundColor: "#1e40af" },
                  }}
                  onClick={saveToLocal}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </Button>
              </Box>
            </Box>
          </Box>

          <DragDropContext onDragEnd={onDragEnd}>
            <Grid container spacing={3}>
              {/* LEFT TOOLBOX */}
              <Grid item xs={12} md={3}>
                <Box
                  sx={{
                    maxHeight: "calc(100vh - 160px)",
                    overflowY: "auto",
                    pr: 1,
                  }}
                >
                  <Stack spacing={2}>
                    {TOOLBOX_CATEGORIES.map((cat) => (
                      <Box key={cat.title} sx={{ p: 0 }}>
                        <Typography sx={{ mb: 1, fontWeight: 600 }}>
                          {cat.title}
                        </Typography>

                        <Droppable
                          droppableId={`toolbox-${cat.title}`}
                          isDropDisabled
                          direction="horizontal"
                        >
                          {(provided) => (
                            <Box
                              ref={provided.innerRef}
                              {...provided.droppableProps}
                              sx={{
                                display: "grid",
                                gridTemplateColumns: "repeat(2, 1fr)",
                                gap: 12 / 8,
                              }}
                            >
                              {cat.items.map((it, index) => (
                                <Draggable
                                  key={it.type}
                                  draggableId={`tool-${it.type}`}
                                  index={index}
                                >
                                  {(dr) => (
                                    <Box
                                      ref={dr.innerRef}
                                      {...dr.draggableProps}
                                      {...dr.dragHandleProps}
                                      onClick={() => {
                                        const tmpl =
                                          findTemplateByType(it.type);
                                        if (!tmpl) return;
                                        const newField = makeField(tmpl);
                                        setFields((prev) => [
                                          ...prev,
                                          newField,
                                        ]);
                                        setSelectedFieldId(newField.id);
                                      }}
                                      sx={{
                                        height: 90,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        flexDirection: "column",
                                        cursor: "grab",
                                        borderRadius: 2,
                                        border: "1px solid #e5e7eb",
                                        backgroundColor: "#ffffff",
                                        p: 1,
                                        textAlign: "center",
                                        transition: "all 150ms ease",
                                        "&:hover": {
                                          border: "1px dashed #16a34a",
                                          backgroundColor: "#ECFDF3",
                                          boxShadow:
                                            "0 0 0 1px rgba(22,163,74,0.2)",
                                          transform: "translateY(-2px)",
                                        },
                                      }}
                                      style={dr.draggableProps.style}
                                    >
                                      <Box sx={{ mb: 0.5 }}>
                                        <IconSvg name={it.icon} size={22} />
                                      </Box>
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: 12 }}
                                      >
                                        {it.label}
                                      </Typography>
                                    </Box>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </Box>
                          )}
                        </Droppable>
                      </Box>
                    ))}
                  </Stack>
                </Box>
              </Grid>

              {/* RIGHT CANVAS */}
              <Grid item xs={12} md={9}>
                <Box
                  sx={{
                    maxHeight: "calc(100vh - 160px)",
                    overflowY: "auto",
                    pr: 1,
                  }}
                >
                  <Paper
                    sx={{
                      p: 3,
                      height: "calc(100vh - 160px)",
                      overflowY: "auto",
                      width: "750px",
                      maxWidth: "900px",
                      mx: "auto",
                      border: "2px dashed #cbd5e1",
                      borderRadius: 3,
                      backgroundColor: "#f8fafc",
                    }}
                  >
                    {/* Form title input */}
                    <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
                      <TextField
                        fullWidth
                        placeholder="Enter form name"
                        value={formTitle}
                        onChange={(e) => setFormTitle(e.target.value)}
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            fontSize: "1.25rem",
                            fontWeight: 600,
                          },
                        }}
                      />
                      <IconButton
                        onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
                        sx={{
                          border: "1px solid #e5e7eb",
                          borderRadius: 2,
                        }}
                      >
                        <EditOutlinedIcon />
                      </IconButton>

                      <Popover
                        open={Boolean(settingsAnchorEl)}
                        anchorEl={settingsAnchorEl}
                        onClose={() => setSettingsAnchorEl(null)}
                        anchorOrigin={{
                          vertical: "bottom",
                          horizontal: "right",
                        }}
                        transformOrigin={{
                          vertical: "top",
                          horizontal: "right",
                        }}
                      >
                        <Box sx={{ p: 2, width: 250 }}>
                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Title Color
                          </Typography>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
                            <input
                              type="color"
                              value={formTitleColor}
                              onChange={(e) => setFormTitleColor(e.target.value)}
                              style={{
                                width: "100%",
                                height: 40,
                                cursor: "pointer",
                                border: "1px solid #e5e7eb",
                                borderRadius: 4,
                              }}
                            />
                          </Box>

                          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Alignment
                          </Typography>
                          <Box sx={{ display: "flex", gap: 1, bgcolor: "#f3f4f6", p: 0.5, borderRadius: 1 }}>
                            {[
                              { val: "left", icon: <FormatAlignLeftIcon /> },
                              { val: "center", icon: <FormatAlignCenterIcon /> },
                              { val: "right", icon: <FormatAlignRightIcon /> },
                            ].map((opt) => (
                              <IconButton
                                key={opt.val}
                                size="small"
                                onClick={() => setTitleAlignment(opt.val)}
                                sx={{
                                  flex: 1,
                                  bgcolor: titleAlignment === opt.val ? "#fff" : "transparent",
                                  boxShadow: titleAlignment === opt.val ? "0 1px 2px rgba(0,0,0,0.1)" : "none",
                                  "&:hover": { bgcolor: "#fff" },
                                }}
                              >
                                {opt.icon}
                              </IconButton>
                            ))}
                          </Box>
                        </Box>
                      </Popover>
                    </Box>






                    <Droppable droppableId="canvas">
                      {(provided, snapshot) => (
                        <Box
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          sx={{
                            minHeight: 400,
                            borderRadius: 2,
                            transition: "background 0.2s ease",
                            background: snapshot.isDraggingOver
                              ? "#f5f7ff"
                              : "transparent",
                          }}
                        >
                          {fields.length === 0 && (
                            <Box
                              sx={{
                                border: "1px dashed #d4d4d4",
                                borderRadius: 2,
                                bgcolor: "#fafafa",
                                py: 4,
                                px: 2,
                                textAlign: "center",
                                mb: 2,
                              }}
                            >
                              <Typography
                                variant="h6"
                                sx={{ fontWeight: 600, mb: 1 }}
                              >
                                Start building!
                              </Typography>
                              <Typography sx={{ color: "text.secondary" }}>
                                Drag fields from the left panel and drop here to
                                add them to your form.
                              </Typography>
                            </Box>
                          )}

                          {fields.map((f, i) => (
                            <Draggable
                              key={f.id}
                              draggableId={f.id}
                              index={i}
                            >
                              {(dr) => {
                                const isSelected =
                                  selectedFieldId === f.id;

                                return (
                                  <Box
                                    ref={dr.innerRef}
                                    {...dr.draggableProps}
                                    {...dr.dragHandleProps}
                                    onClick={() =>
                                      setSelectedFieldId(f.id)
                                    }
                                    sx={{
                                      py: 3,
                                      px: 1,
                                      borderBottom: "1px solid #eee",
                                      backgroundColor: isSelected
                                        ? "#f9fffc"
                                        : "#ffffff",
                                      cursor: "grab",
                                    }}
                                    style={dr.draggableProps.style}
                                  >
                                    <Typography
                                      sx={{
                                        fontWeight: 600,
                                        mb: 1.5,
                                      }}
                                    >
                                      {f.label}
                                    </Typography>

                                    {renderFieldInput(f)}

                                    <Box
                                      sx={{
                                        mt: 1.5,
                                        display: "flex",
                                        justifyContent: "flex-end",
                                        gap: 1,
                                      }}
                                    >
                                      {/* Edit pencil icon */}
                                      <Tooltip title="Edit field">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            openEdit(f);
                                          }}
                                          sx={{
                                            border: "1px solid #e5e7eb",
                                            borderRadius: 2,
                                          }}
                                        >
                                          <EditOutlinedIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>

                                      {/* Red outlined delete icon */}
                                      <Tooltip title="Delete field">
                                        <IconButton
                                          size="small"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setFields((x) =>
                                              x.filter(
                                                (ff) => ff.id !== f.id
                                              )
                                            );
                                            if (
                                              selectedFieldId === f.id
                                            ) {
                                              setSelectedFieldId(null);
                                            }
                                          }}
                                          sx={{
                                            border: "1px solid #ef4444",
                                            borderRadius: 2,
                                            color: "#ef4444",
                                            "&:hover": {
                                              backgroundColor: "#fee2e2",
                                            },
                                          }}
                                        >
                                          <DeleteIcon fontSize="small" />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                );
                              }}
                            </Draggable>
                          ))}

                          {provided.placeholder}
                        </Box>
                      )}
                    </Droppable>
                  </Paper>
                </Box>
              </Grid>
            </Grid>
          </DragDropContext>

          {/* Edit field dialog */}
          <Dialog
            open={!!editingField}
            onClose={closeEdit}
            fullWidth
            maxWidth="sm"
          >
            <DialogTitle>Edit Field</DialogTitle>
            <DialogContent>
              {editingField && (
                <Box sx={{ mt: 1 }}>
                  {/* LABEL - common */}
                  <TextField
                    label="Field Label"
                    fullWidth
                    sx={{ mb: 2 }}
                    value={editingField.label}
                    onChange={(e) =>
                      setEditingField({
                        ...editingField,
                        label: e.target.value,
                      })
                    }
                  />

                  {/* TEXT + TEXTAREA: only label -> nothing else needed */}

                  {/* DROPDOWN / RADIO / CHECKBOX / MULTIPLE / IMAGE_CHOICES: options editing */}
                  {(editingField.type === "select" ||
                    editingField.type === "radio" ||
                    editingField.type === "checkbox" ||
                    editingField.type === "multiple" ||
                    editingField.type === "image_choices") && (
                      <>
                        <Typography sx={{ fontWeight: 600, mb: 1 }}>
                          Options
                        </Typography>

                        {(editingField.options || []).map((opt) => (
                          <Stack
                            key={opt.id}
                            direction="row"
                            spacing={2}
                            sx={{ mb: 1 }}
                          >
                            <TextField
                              size="small"
                              fullWidth
                              label="Option label"
                              value={opt.label}
                              onChange={(e) =>
                                updateOption(opt.id, {
                                  label: e.target.value,
                                  value: `${opt.id}_${e.target.value
                                    .toLowerCase()
                                    .replace(/\s+/g, "_")}`,

                                })
                              }
                            />
                            <IconButton
                              onClick={() => removeOptionEditing(opt.id)}
                              sx={{
                                border: "1px solid #ef4444",
                                borderRadius: 2,
                                color: "#ef4444",
                                "&:hover": {
                                  backgroundColor: "#fee2e2",
                                },
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Stack>
                        ))}

                        <Button
                          variant="outlined"
                          onClick={addOption}
                          sx={{
                            mt: 1,
                            borderRadius: 2,
                            textTransform: "none",
                          }}
                        >
                          + Add Option
                        </Button>
                      </>
                    )}
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={closeEdit}>Cancel</Button>
              <Button variant="contained" onClick={saveEdit}>
                Save
              </Button>
            </DialogActions>
          </Dialog>

          {/* Preview dialog with mobile / desktop toggle */}
          <Dialog
            open={previewOpen}
            onClose={() => setPreviewOpen(false)}
            fullWidth
            maxWidth="md"
          >
            <DialogTitle sx={{ pb: 1 }}>
              {/* ROW 1: Preview label + icons */}
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  mb: 1,
                }}
              >
                <Typography sx={{ fontWeight: 600 }}>
                  Form Preview
                </Typography>

                <Box sx={{ display: "flex", gap: 1 }}>
                  <Tooltip title="Mobile view">
                    <IconButton
                      size="small"
                      onClick={() => setPreviewMode("mobile")}
                      sx={{
                        borderRadius: 2,
                        border:
                          previewMode === "mobile"
                            ? "1px solid #2563eb"
                            : "1px solid transparent",
                        backgroundColor:
                          previewMode === "mobile"
                            ? "rgba(37,99,235,0.08)"
                            : "transparent",
                      }}
                    >
                      <SmartphoneIcon
                        fontSize="small"
                        sx={{
                          color:
                            previewMode === "mobile"
                              ? "#2563eb"
                              : "#6b7280",
                        }}
                      />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Desktop view">
                    <IconButton
                      size="small"
                      onClick={() => setPreviewMode("desktop")}
                      sx={{
                        borderRadius: 2,
                        border:
                          previewMode === "desktop"
                            ? "1px solid #2563eb"
                            : "1px solid transparent",
                        backgroundColor:
                          previewMode === "desktop"
                            ? "rgba(37,99,235,0.08)"
                            : "transparent",
                      }}
                    >
                      <LaptopMacIcon
                        fontSize="small"
                        sx={{
                          color:
                            previewMode === "desktop"
                              ? "#2563eb"
                              : "#6b7280",
                        }}
                      />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              {/* ROW 2: Form title BELOW */}

            </DialogTitle>


            <DialogContent>
              <Box
                sx={{
                  mt: 2,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "flex-start",
                  pb: 2,
                  backgroundColor:
                    previewMode === "mobile" ? "#f3f4f6" : "transparent",
                }}
              >
                <Box
                  sx={{
                    width: previewMode === "mobile" ? 375 : "100%",
                    maxWidth: previewMode === "desktop" ? 800 : "none",
                    borderRadius: previewMode === "mobile" ? 3 : 1,
                    border:
                      previewMode === "mobile"
                        ? "1px solid #e5e7eb"
                        : "1px solid transparent",
                    boxShadow:
                      previewMode === "mobile"
                        ? "0 10px 25px rgba(15,23,42,0.15)"
                        : "none",
                    p: previewMode === "mobile" ? 2 : 0,
                    backgroundColor: "#ffffff",
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.35rem",
                      lineHeight: 1.2,
                      mb: 3,
                      color: formTitleColor,
                      textAlign: titleAlignment,
                    }}
                  >
                    {formTitle || "Untitled Form"}
                  </Typography>
                  {canvasPreview.map((f) => (
                    <Box key={f.id} sx={{ mb: 3 }}>
                      <Typography sx={{ fontWeight: 600, mb: 1 }}>
                        {f.label} {f.required && "*"}
                      </Typography>
                      {renderFieldInput(f)}
                    </Box>
                  ))}
                </Box>
              </Box>
            </DialogContent>



            <DialogActions>
              <Button onClick={() => setPreviewOpen(false)}>Close</Button>
            </DialogActions>
          </Dialog>


          {/* ✅ SUCCESS DIALOG (ROOT LEVEL) */}
          <Dialog open={successOpen} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Form Saved Successfully 🎉
            </DialogTitle>

            <DialogContent>
              <Typography>
                Your form has been saved successfully.
              </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
              <Button
                variant="contained"
                sx={{ textTransform: "none" }}
                onClick={() => {
                  // Close dialog
                  setSuccessOpen(false);

                  // Clear builder state
                  setFormTitle("");
                  setFormTitleColor("#000000");
                  setTitleAlignment("left");
                  setFields([]);

                  localStorage.removeItem("formbuilder_title");
                  localStorage.removeItem("formbuilder_titleColor");
                  localStorage.removeItem("formbuilder_titleAlignment");
                  localStorage.removeItem("formbuilder_form");

                  // Redirect
                  navigate("/forms");
                }}
              >
                Go to Forms
              </Button>
            </DialogActions>
          </Dialog>

        </Container>
      </Box>
    </>
  );
}






