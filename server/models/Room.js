import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema({
    roomId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        default: 'New Workspace',
    },
    hostId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    canvasState: {
        type: [mongoose.Schema.Types.Mixed],
        default: []
    },
    yjsState: {
        type: Buffer,
        default: null
    },
    isArchived: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true,
});

const Room = mongoose.model('Room', roomSchema);
export default Room;
