const { Collaborator } = await import("../models/Collaborator.js");
import type { Request, Response } from "express";
import { Document } from "../models/Document.js";
import {createDocSchema, updateDocSchema} from "../schemas/index.js";
import { assertIsDocumentOwner, assertCanWriteDocument, assertCanReadDocument, fetchEnrichedCollaborators } from "../utils/documentAcl.js";

export const getDocuments = async (req: Request, res: Response) => {
    try {
        // my owned docs
        const profileId = req.user?.profileId ?? "";
        const myDocs = await Document.find({ ownerId: profileId }).lean();
        
        // my other docs with viewer/editor access
        const collaborators = await Collaborator.find({ profileId }).lean();
        const docIds = collaborators.map(c => c.documentId.toString());
        const otherDocs = docIds.length
            ? await Document.find({ _id: { $in: docIds } }).lean()
            : [];

        // Build permissions: owner = write, collaborator role = viewer or editor
        // Create a map to avoid duplicates
        const resultDocs: Record<string, any> = {};
        [myDocs, otherDocs].flat().forEach((doc) => {
            if(resultDocs[doc._id.toString()]) return;
            const permissions = ["read"];
            const isEditor = collaborators.some(c => c.documentId.toString() === doc._id.toString() && c.role === "editor");
            if(doc.ownerId.toString() === profileId) permissions.push("write");
            else if(isEditor) permissions.push("write");
            resultDocs[doc._id.toString()] = {...doc, permissions};
        });

        return res.status(200).json({ documents: Object.values(resultDocs) });
    } catch (error) {
        console.error('Error getting documents', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

export const getDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await assertCanReadDocument(req.user?.profileId ?? "", id);
        const doc = await Document.findOne({_id: id});
        if(!doc) {
            return res.status(404).json({message: "Document not found"});
        }
        return res.status(200).json({document: doc});
    } catch (error) {
        console.log("Error fetchig the required document", error);
        return res.status(500).json({message: "Internal server error"})
        
    }
}

export const createDocument = async (req: Request, res: Response) => {
    try {
        const profileId = req.user?.profileId ?? "";
        const parsed = createDocSchema.safeParse(req.body);
        if(!parsed.success) {
            console.log("parsing error", parsed.error);
            return res.status(400).json({message: "Invalid request body"});
        }
        const { title, content } = parsed.data;
        const document = await Document.create({ title, content, ownerId: profileId });
        return res.status(201).json({document});
    } catch (error) {
        console.log("Error creating the document", error);
        return res.status(500).json({error: "Internal server error"});
    }
}

export const updateDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await assertCanWriteDocument(req.user?.profileId ?? "", id);
        const parsed = updateDocSchema.safeParse(req.body);
        if(!parsed.success) {
            console.log("parsing error", parsed.error);
            return res.status(400).json({message: "Invalid request body"});
        }
        const { title, content } = parsed.data;
        const document = await Document.findByIdAndUpdate(id, { title, content }, { new: true });
        if(!document) {
            return res.status(404).json({message: "Document not found"});
        }
        return res.status(200).json({message: "Document updated successfully"});
    } catch (error) {
        console.log("Error updating the document", error);
        return res.status(500).json({error: "Internal server error"});
    }
}

export const deleteDocument = async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;
        await assertIsDocumentOwner(req.user?.profileId ?? "", id);
        const document = await Document.findByIdAndDelete(id);
        if(!document) {
            console.log("Document not found");
            return res.status(404).json({message: "Document not found"});
        }
        return res.status(200).json({message: "Document deleted successfully"});
    } catch (error) {
        console.log("Error deleting the document", error);
        return res.status(500).json({error: "Internal server error"});
    }
}
