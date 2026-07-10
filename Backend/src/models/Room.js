import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Untitled Project' },
  ownerId: { type: String }, // Firebase UID of creator
  ownerName: { type: String, default: 'Developer' }, // Display name of creator
  template: { type: String, default: 'react' },
  files: { type: String, default: '[]' }, // JSON stringified array of files
  status: { type: String, enum: ['active', 'closed'], default: 'active' },
  accessType: { type: String, enum: ['public', 'private'], default: 'private' },
  description: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  participants: [{ type: String }] // Array of Firebase UIDs of users who joined
});

export default mongoose.model('Room', RoomSchema);

