import mongoose, { Document, Schema } from 'mongoose';
import { IUser } from './User';

interface Experience {
    title: string;
    company: string;
    description: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
}

interface Education {
    school: string;
    degree: string;
    year?: string;
    startDate?: string;
    endDate?: string;
    current?: boolean;
}

interface SocialLinks {
    linkedin?: string;
    github?: string;
    portfolio?: string;
    twitter?: string;
}

interface Project {
    title: string;
    description: string;
    technologies: string[];
    link?: string;
}

interface Certification {
    name: string;
    issuer: string;
    date: string;
    link?: string;
}

interface Language {
    language: string;
    proficiency: string; // e.g. Native, Fluent, Intermediate
}

export interface IResume extends Document {
    user: IUser['_id'];
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    summary?: string;
    socialLinks?: SocialLinks;
    experience: Experience[];
    education: Education[];
    skills: string[];
    projects: Project[];
    certifications: Certification[];
    languages: Language[];
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
    summary: { type: String },

    socialLinks: {
        linkedin: String,
        github: String,
        portfolio: String,
        twitter: String
    },
    
    experience: [{
        title: String,
        company: String,
        description: String,
        startDate: String,
        endDate: String,
        current: Boolean
    }],

    education: [{
        school: String,
        degree: String,
        year: String,
        startDate: String,
        endDate: String,
        current: Boolean
    }],

    skills: [String],

    projects: [{
        title: String,
        description: String,
        technologies: [String],
        link: String
    }],

    certifications: [{
        name: String,
        issuer: String,
        date: String,
        link: String
    }],

    languages: [{
        language: String,
        proficiency: String
    }]

}, {
    timestamps: true 
});

export default mongoose.model<IResume>('Resume', resumeSchema);
