import { pool } from "../config/db.js";
import crypto from "crypto";

export const createNotification = async (trip_id: string,user_id: string,type: string,title: string,message: string) => {

  const connection = await pool.getConnection();

  try {
    const notification_id = crypto.randomUUID();

    await connection.query(
      `INSERT INTO notifications 
       (notification_id, user_id, trip_id, notification_type, title, message)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [notification_id, user_id, trip_id, type, title, message]
    );

    return {
      success: true,
      notification_id
    };

  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error creating notification"
    };

  } finally {
    connection.release();
  }
};

export const getNotificationsByUserId = async (user_id: string) => {
    const connection = await pool.getConnection();
    try {
        
        const [rows] = await connection.query(
            `
            SELECT 
                n.notification_id,
                n.trip_id,
                n.notification_type,
                n.title,
                n.message,
                n.is_read,
                n.created_at,
                n.read_at,
                u.full_name,
                u.email,
                t.trip_name
            FROM notifications n
            JOIN users u ON n.user_id = u.user_id
            JOIN trips t ON n.trip_id = t.trip_id
            WHERE n.user_id = ?
            ORDER BY n.created_at DESC
            `,[user_id]
        );
        //console.log("Notification rows:", rows);

        return {
            success: true,
            notifications: rows
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while fetching notifications"
        };
    } finally {
        connection.release();
    }
};


export const markNotificationAsRead = async (notification_id: string, user_id?: string) => {
    const connection = await pool.getConnection();
    try {
        const query = user_id
            ? `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE notification_id = ? AND user_id = ?`
            : `UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE notification_id = ?`;
        const params = user_id ? [notification_id, user_id] : [notification_id];

        const [result] = await connection.query(query, params);
        const affectedRows = Array.isArray(result) ? (result[0] as any).affectedRows ?? 0 : (result as any).affectedRows ?? 0;

        if (affectedRows === 0) {
            return {
                success: false,
                message: user_id
                    ? "Notification not found or not owned by user"
                    : "Notification not found"
            };
        }

        return {
            success: true,
            message: "Notification marked as read"
        };
    } catch (error) {        
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking the notification as read"
        };
    } finally {
        connection.release();
    }
};

export const markAllNotificationsAsReadForTrip = async (trip_id: string, user_id: string) => {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            UPDATE notifications SET is_read = 1, read_at = CURRENT_TIMESTAMP WHERE trip_id = ? AND user_id = ?
        `, [trip_id, user_id]);
        return {
            success: true,
            message: "All notifications for the trip marked as read"
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking all notifications as read for the trip"
        };
    } finally {
        connection.release();
    }   
};

export const markAllNotificationsAsRead = async (user_id: string) => {
    const connection = await pool.getConnection();
    try {
        await connection.query(`
            UPDATE notifications
            SET is_read = 1, read_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND is_read = 0
        `, [user_id]);

        return {
            success: true,
            message: "All notifications marked as read"
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while marking all notifications as read"
        };
    } finally {
        connection.release();
    }
};

export const deleteNotification = async (notification_id: string,user_id: string) => {

  const connection = await pool.getConnection();

  try {

    const [result]: any = await connection.query(
      `DELETE FROM notifications 
       WHERE notification_id = ? 
       AND user_id = ?`,
      [notification_id, user_id]
    );

    if (result.affectedRows === 0) {
      return {
        success: false,
        message: "Notification not found or not authorized"
      };
    }

    return {
      success: true,
      message: "Notification deleted successfully"
    };

  } catch (error) {

    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Error deleting notification"
    };

  } finally {
    connection.release(); 
  }
};


export const countUnreadNotifications = async ( user_id: string) => {
    const connection = await pool.getConnection();
    try {
        const [rows] = await connection.query(`
            SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = ? AND is_read = 0
        `, [user_id]);
        const unreadCount = (rows as any[])[0].unread_count;
        return {
            success: true,
            unreadCount
        };
    } catch (error) {
        return {
            success: false,
            message: error instanceof Error ? error.message : "An error occurred while counting unread notifications"
        };
    } finally {
        connection.release();
    }   
};

export default {
    createNotification,
    getNotificationsByUserId,
    markNotificationAsRead,
    markAllNotificationsAsReadForTrip,
    markAllNotificationsAsRead,
    deleteNotification,
    countUnreadNotifications
}
