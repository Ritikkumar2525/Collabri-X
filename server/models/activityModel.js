import mongoose from 'mongoose';

const activitySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
        },
        type: {
            type: String,
            required: true,
            enum: ['CREATE_ROOM', 'JOIN_ROOM', 'UPDATE_ROOM', 'LEAVE_ROOM', 'ARCHIVE_ROOM', 'RESTORE_ROOM'],
        },
        roomId: {
            type: String,
            required: true,
        },
        roomName: {
            type: String,
        },
        details: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
