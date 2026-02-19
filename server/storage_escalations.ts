// Extension to storage.ts for voice escalations
// This should be merged into the main storage.ts file

export interface VoiceEscalation {
  id: number;
  type: 'voice' | 'chat';
  reason: string;
  customerPhone?: string;
  summary?: string;
  callSid?: string;
  status: 'pending' | 'in_progress' | 'resolved';
  notes?: string;
  createdAt: Date;
  resolvedAt?: Date;
}

// Add these methods to the Storage class in storage.ts:

/*
async createEscalation(data: Omit<VoiceEscalation, 'id'>): Promise<VoiceEscalation> {
  const result = await this.db.run(
    `INSERT INTO voice_escalations (type, reason, customerPhone, summary, callSid, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [data.type, data.reason, data.customerPhone, data.summary, data.callSid, data.status, data.createdAt.toISOString()]
  );
  
  return {
    id: result.lastID!,
    ...data
  };
}

async getAllEscalations(): Promise<VoiceEscalation[]> {
  const rows = await this.db.all(
    `SELECT * FROM voice_escalations ORDER BY createdAt DESC`
  );
  
  return rows.map(row => ({
    ...row,
    createdAt: new Date(row.createdAt),
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined
  }));
}

async updateEscalation(id: number, data: Partial<VoiceEscalation>): Promise<VoiceEscalation> {
  const updates: string[] = [];
  const values: any[] = [];
  
  if (data.status) {
    updates.push('status = ?');
    values.push(data.status);
  }
  
  if (data.notes) {
    updates.push('notes = ?');
    values.push(data.notes);
  }
  
  if (data.resolvedAt) {
    updates.push('resolvedAt = ?');
    values.push(data.resolvedAt.toISOString());
  }
  
  values.push(id);
  
  await this.db.run(
    `UPDATE voice_escalations SET ${updates.join(', ')} WHERE id = ?`,
    values
  );
  
  const row = await this.db.get('SELECT * FROM voice_escalations WHERE id = ?', [id]);
  
  return {
    ...row,
    createdAt: new Date(row.createdAt),
    resolvedAt: row.resolvedAt ? new Date(row.resolvedAt) : undefined
  };
}
*/

// Database migration to add voice_escalations table:
/*
CREATE TABLE IF NOT EXISTS voice_escalations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL,
  reason TEXT NOT NULL,
  customerPhone TEXT,
  summary TEXT,
  callSid TEXT,
  status TEXT NOT NULL,
  notes TEXT,
  createdAt TEXT NOT NULL,
  resolvedAt TEXT
);
*/
