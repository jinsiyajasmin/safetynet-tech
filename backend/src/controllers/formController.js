const Form = require("../models/form");
const FormResponse = require("../models/FormResponse");
const { sendEmail } = require("../services/emailService");


// ✅ Save new form
exports.saveForm = async (req, res, next) => {
  try {
    const { title, fields, titleColor, titleAlignment } = req.body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Fields array is required",
      });
    }

    const newForm = await Form.create({
      title: title || "Untitled Form",
      fields,
      titleColor,
      titleAlignment,

      createdBy: req.user?.id,
    });

    res.status(201).json({
      success: true,
      message: "Form saved successfully",
      form: newForm,
    });
  } catch (error) {
    console.error("Save form error:", error);
    next(error);
  }
};

// ✅ Get all forms
exports.getAllForms = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    // Only return forms created by the current user
    const forms = await Form.find({ createdBy: userId }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: forms,
    });
  } catch (error) {
    console.error("Get forms error:", error);
    next(error);
  }
};

// ✅ Get single form by ID
exports.getFormById = async (req, res, next) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate({
        path: 'createdBy',
        select: 'clientId',
        populate: {
          path: 'clientId',
          select: 'logo name'
        }
      });

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      data: form,
    });
  } catch (error) {
    console.error("Get form error:", error);
    next(error);
  }
};

// ✅ Delete form by ID
exports.deleteForm = async (req, res, next) => {
  try {
    const { id } = req.params;

    const form = await Form.findByIdAndDelete(id);

    if (!form) {
      return res.status(404).json({
        success: false,
        message: "Form not found",
      });
    }

    res.json({
      success: true,
      message: "Form deleted successfully",
    });
  } catch (error) {
    console.error("Delete form error:", error);
    next(error);
  }
};


exports.saveResponse = async (req, res) => {
  try {
    const response = await FormResponse.create({
      ...req.body,
      submittedBy: req.user?.id
    });
    res.json({ success: true, data: response });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};
exports.getAllResponses = async (req, res) => {
  try {
    const userId = req.user?.id;
    const filter = { submittedBy: userId };
    if (req.query.category) {
      filter.category = req.query.category;
    }

    const responses = await FormResponse.find(filter)
      .sort({ createdAt: -1 })
      .populate("formId", "title");

    res.json({
      success: true,
      data: responses,
    });
  } catch (err) {
    console.error("Get responses error:", err);
    res.status(500).json({ success: false });
  }
};

exports.deleteResponse = async (req, res) => {
  try {
    const { id } = req.params;
    await FormResponse.findByIdAndDelete(id);
    res.json({ success: true, message: "Response deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete" });
  }
};

exports.updateResponse = async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body;
    const updated = await FormResponse.findByIdAndUpdate(
      id,
      { answers },
      { new: true }
    );
    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update" });
  }
};

exports.sendResponseEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.body;
    const senderEmail = req.user?.email;

    if (!email) {
      return res.status(400).json({ success: false, message: "Recipient email is required" });
    }

    const response = await FormResponse.findById(id).populate("formId");
    if (!response) {
      return res.status(404).json({ success: false, message: "Response not found" });
    }

    if (!response.formId) {
      return res.status(404).json({ success: false, message: "Form definition not found (might be deleted)" });
    }

    // Format answers
    let htmlContent = `
      <h2>${response.formId.title}</h2>
      <p>Submitted on: ${new Date(response.createdAt).toLocaleString()}</p>
      <h3>Answers:</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f2f2f2;">
            <th>Field</th>
            <th>Answer</th>
          </tr>
        </thead>
        <tbody>
    `;

    // We need to map answers to field labels if possible, but answers is just a map of id->value.
    // formId has the fields definition.
    const fields = response.formId.fields || [];
    const answers = response.answers || {};

    fields.forEach(field => {
      const val = answers[field.id] || "";
      htmlContent += `
         <tr>
           <td>${field.label}</td>
           <td>${val}</td>
         </tr>
       `;
    });

    htmlContent += `
        </tbody>
      </table>
      <p>Sent by: ${senderEmail || "System"}</p>
    `;

    const result = await sendEmail({
      to: email,
      subject: `Report: ${response.formId.title}`,
      html: htmlContent,
      replyTo: senderEmail,
    });

    if (result.success) {
      res.json({ success: true, message: "Email sent successfully" });
    } else {
      console.error("Email service error:", result.error);
      res.status(500).json({ success: false, message: "Failed to send email", error: result.error });
    }
  } catch (err) {
    console.error("Email send error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
