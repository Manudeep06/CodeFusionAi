import mongoose from 'mongoose';

const RoomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  name: { type: String, default: 'Untitled Project' },
  ownerId: { type: String }, // Firebase UID of creator
  template: { type: String, default: 'react' },
  files: { type: String, default: '[]' }, // JSON stringified array of files
  lastActive: { type: Date, default: Date.now }
});

export default mongoose.model('Room', RoomSchema);
