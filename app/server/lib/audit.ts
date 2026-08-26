import { query } from '../db/db.js'

export interface AuditParams {
  tableName: string
  recordId?: string
  actionType: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'ADJUST' | 'STATUS_CHANGE'
  oldData?: any
  newData?: any
  performedBy?: string
  ipAddress?: string
}

export async function logAuditAction(params: AuditParams): Promise<void> {
  try {
    const {
      tableName,
      recordId = 'N/A',
      actionType,
      oldData,
      newData,
      performedBy = 'SYSTEM',
      ipAddress = '',
    } = params

    const oldJson = oldData ? (typeof oldData === 'string' ? oldData : JSON.stringify(oldData)) : null
    const newJson = newData ? (typeof newData === 'string' ? newData : JSON.stringify(newData)) : null

    await query(
      `INSERT INTO audit_logs (table_name, record_id, action_type, old_data, new_data, performed_by, ip_address, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, datetime('now'))`,
      [tableName, String(recordId), actionType, oldJson, newJson, performedBy, ipAddress]
    )
  } catch (err) {
    console.error('⚠️ Failed to write audit log:', err)
  }
}
