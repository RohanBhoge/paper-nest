import {
  createOrganizationNotification,
  getOrganizationNotifications,
} from "../utils/helperFunctions.js";

const createNotification = async (req, res) => {
  const userId = req.user?.id;
  const userRole = "admin";

  if (userRole !== "admin") {
    return res.status(403).json({
      success: false,
      message: "Forbidden: Only administrators can create notifications.",
    });
  }

  const { content, event_date } = req.body;

  if (!content) {
    return res
      .status(400)
      .json({ success: false, message: "Notification content is required." });
  }

  if (!event_date) {
    return res
      .status(400)
      .json({ success: false, message: "Event date is required." });
  }

  const dateObj = new Date(event_date);
  if (isNaN(dateObj.getTime())) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid event date format." });
  }

  const validDate = String(event_date).split("T")[0];

  console.log("[DEBUG] createNotification - validDate:", validDate);

  try {
    const newId = await createOrganizationNotification(
      userId,
      content,
      validDate
    );

    res.status(201).json({
      success: true,
      message: "Notification created successfully.",
      id: newId,
      content: content,
    });
  } catch (error) {
    console.error("API Error creating notification:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during notification creation.",
    });
  }
};

const getAllNotifications = async (req, res) => {
  const userId = req.user?.id;
  const userRole = req.user?.role;
  let adminUserId = userId;

  if (userRole === "student") {
    adminUserId = req.user.adminId;
  }

  if (!adminUserId) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized: User ID or Admin ID not found.",
    });
  }

  try {
    const notifications = await getOrganizationNotifications(adminUserId);

    res.status(200).json({
      success: true,
      count: notifications.length,
      notifications: notifications,
    });
  } catch (error) {
    console.error("API Error fetching notifications:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while retrieving notifications.",
    });
  }
};

export { createNotification, getAllNotifications };
