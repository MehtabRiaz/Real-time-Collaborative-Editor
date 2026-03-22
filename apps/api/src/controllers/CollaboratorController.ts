import type { Request, Response } from "express";
import { Collaborator } from "../models/Collaborator.js";
import {Profile} from "../models/Profile.js"
import { addCollaboratorSchema, updateCollaboratorSchema } from "../schemas/index.js";
import { assertIsDocumentOwner, assertNotDocumentOwner, assertCanReadDocument, fetchEnrichedCollaborators } from "../utils/documentAcl.js";

export const getCollaborators = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        const profileId = req.user?.profileId ?? "";
        await assertCanReadDocument(profileId, documentId);
        const collaborators = await fetchEnrichedCollaborators(documentId);
        return res.status(200).json({collaborators});
    } catch (error) {
        console.log("Error getting collaborators", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const getCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        await assertCanReadDocument(req.user?.profileId ?? "", documentId);
        const collaboratorId = req.params.id as string;
        const collaborator = await Collaborator.findById(collaboratorId);
        if(!collaborator) {
            console.log("Collaborator not found");
            return res.status(404).json({message: "Collaborator not found"});
        }
        const profile = await Profile.findById(collaborator.profileId);
        if(!profile) {
            console.log("Profile not found");
            return res.status(404).json({message: "Profile not found"});
        }
        return res.status(200).json({collaborator: {
            _id: collaborator._id.toString(),
            name: `${profile.firstName} ${profile.lastName}`.trim(),
            permissions: collaborator.role === "editor" ? ["read", "write"] : ["read"],
        }});
    } catch (error) {
        console.log("Error getting collaborator", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}

export const addCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        await assertIsDocumentOwner(req.user?.profileId ?? "", documentId);
        const parsed = addCollaboratorSchema.safeParse(req.body);
        if(!parsed.success) {
            console.log("Invalid request body", parsed.error);
            return res.status(400).json({message: "Invalid request body"});
        }
        const { profileId, role } = parsed.data;
        await assertNotDocumentOwner(profileId, documentId);
        const existing = await Collaborator.findOne({documentId, profileId});
        if(existing) {
            console.log("Collaborator already exists");
            return res.status(400).json({message: "Collaborator already exists"});
        }
        const collaborator = await Collaborator.create({documentId, profileId, role});
        return res.status(201).json({collaborator: collaborator.toObject()});
    } catch (error) {
        console.log("Error adding collaborator", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const updateCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        const id = req.params.id as string;
        await assertIsDocumentOwner(req.user?.profileId ?? "", documentId);
        const parsed = updateCollaboratorSchema.safeParse(req.body);
        if(!parsed.success) {
            console.log("Invalid request body", parsed.error);
            return res.status(400).json({message: "Invalid request body"});
        }
        const {role} = parsed.data;
        const collaborator = await Collaborator.findOneAndUpdate({_id: id, documentId}, {role}, {new: true});
        if(!collaborator) {
            console.log("Collaborator not found");
            return res.status(404).json({message: "Collaborator not found"});
        }
        return res.status(200).json({collaborator: collaborator.toObject()});
    } catch (error) {
        console.log("Error updating collaborator", error);
        return res.status(500).json({message: "Internal server error"});
    }
}

export const removeCollaborator = async (req: Request, res: Response) => {
    try {
        const documentId = req.params.documentId as string;
        const id = req.params.id as string;
        await assertIsDocumentOwner(req.user?.profileId ?? "", documentId);
        const collaborator = await Collaborator.findOneAndDelete({_id: id, documentId});
        if(!collaborator) {
            console.log("Collaborator not found");
            return res.status(404).json({message: "Collaborator not found"});
        }
        return res.status(200).json({message: "Collaborator removed successfully"});
    } catch (error) {
        console.log("Error removing collaborator", error);
        return res.status(500).json({message: "Internal server error"});
    }
}
