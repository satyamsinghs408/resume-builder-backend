import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

interface Experience {
    title: string;
    company: string;
    description: string;
}

interface Education {
    school: string;
    degree: string;
    year: string;
}

export interface IResume extends Document {
    user: IUser['_id'];
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    experience: Experience[];
    education: Education[];
    createdAt: Date;
    updatedAt: Date;
}

const resumeSchema: Schema = new Schema({
    // --- THIS SECTION IS CRITICAL ---
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // --------------------------------
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    phone: { type: String },
    address: { type: String },
    
    experience: [{
        title: String,
        company: String,
        description: String
    }],

    education: [{
        school: String,
        degree: String,
        year: String
    }]

}, {
    timestamps: true 
});

export default mongoose.model<IResume>('Resume', resumeSchema);
