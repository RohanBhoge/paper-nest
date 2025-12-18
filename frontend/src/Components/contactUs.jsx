import { useState } from "react";
import { Mail, Send } from "lucide-react";
import emailjs from "@emailjs/browser";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    organization: "",
    description: "",
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.email ||
      !formData.mobile ||
      !formData.organization ||
      !formData.description
    ) {
      alert("Please fill all fields");
      return;
    }

    setLoading(true);

    try {
      await emailjs.send(
        "service_vuwiyuw",          // ✅ Your Service ID
        "template_9xyf3wu",         // 🔴 Replace
        {
          full_name: formData.fullName,
          email: formData.email,
          mobile: formData.mobile,
          organization: formData.organization,
          message: formData.description,
        },
        "vL40vBIDBlCxiQ1_s"           // 🔴 Replace
      );

      setSubmitted(true);
      setFormData({
        fullName: "",
        email: "",
        mobile: "",
        organization: "",
        description: "",
      });

      setTimeout(() => setSubmitted(false), 3000);
    } catch (err) {
      alert("Email failed to send");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">
        <div className="text-center mb-6">
          <div className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <Mail className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-blue-900">Contact Us</h1>
        </div>

        {submitted ? (
          <p className="text-center text-green-600 font-semibold">
            ✅ Message sent successfully!
          </p>
        ) : (
          <div className="space-y-4">
            <input
              name="fullName"
              placeholder="Full Name"
              value={formData.fullName}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              name="email"
              type="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              name="mobile"
              placeholder="Mobile"
              value={formData.mobile}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <input
              name="organization"
              placeholder="Organization"
              value={formData.organization}
              onChange={handleChange}
              className="w-full border p-3 rounded"
            />
            <textarea
              name="description"
              rows="4"
              placeholder="Message"
              value={formData.description}
              onChange={handleChange}
              className="w-full border p-3 rounded resize-none"
            />

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded flex items-center justify-center gap-2"
            >
              <Send size={18} />
              {loading ? "Sending..." : "Send Message"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}