import prisma from './prisma.js';

/**
 * Logs an administrative action to the audit_logs table.
 * 
 * @param {string} adminId - The UUID of the admin performing the action.
 * @param {string} action - The action type (e.g., 'CREATE', 'UPDATE', 'DELETE').
 * @param {string} entityType - The type of entity being acted upon (e.g., 'MenuItem', 'Order').
 * @param {string} entityId - The UUID of the entity.
 * @param {object} details - Any additional details or changes (will be stored as JSON).
 */
export const logAdminAction = async (adminId, action, entityType, entityId, details = {}) => {
  try {
    await prisma.audit_logs.create({
      data: {
        admin_id: adminId,
        action,
        entity_type: entityType,
        entity_id: entityId,
        details,
      },
    });
  } catch (err) {
    console.error('Failed to create audit log:', err);
    // We don't want to throw here to avoid breaking the main request flow,
    // but in a production app, you might want to retry or alert.
  }
};

export default logAdminAction;
