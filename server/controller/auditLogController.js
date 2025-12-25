const database = require('../config/database');

// Get audit logs
const getAuditLogs = async (req, res) => {
  try {
    const { pg_id } = req.query;
    const { role, pg_id: userPgId } = req.user;

    let query = `
      SELECT al.*, u.name as user_name, u.role as user_role, p.name as pg_name, p.pg_uid
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      LEFT JOIN pgs p ON al.pg_id = p.id
    `;

    
    const params = [];

    if (role === 'pg_admin') {
      query += ' WHERE al.pg_id = ?';
      params.push(userPgId);
    } else if (pg_id) {
      query += ' WHERE al.pg_id = ?';
      params.push(pg_id);
    }

    query += ' ORDER BY al.created_at DESC LIMIT 100';

    const [logs] = await database.query(query, params);
    res.json({ audit_logs: logs });
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create audit log (utility function - can be used by other controllers)
const createAuditLog = async (pg_id, user_id, action, old_value = null, new_value = null) => {
  try {
    await database.query(
      'INSERT INTO audit_logs (pg_id, user_id, action, old_value, new_value) VALUES (?, ?, ?, ?, ?)',
      [pg_id, user_id, action, old_value ? JSON.stringify(old_value) : null, new_value ? JSON.stringify(new_value) : null]
    );
  } catch (error) {
    console.error('Create audit log error:', error);
    // Don't throw - audit logging should not break main operations
  }
};

module.exports = {
  getAuditLogs,
  createAuditLog,
};

