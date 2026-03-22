import { Document } from "../models/Document.js";
import { Collaborator } from "../models/Collaborator.js";
import { Profile } from "../models/Profile.js";
import type { Profile as ProfileType } from "../models/Profile.js";

export const assertIsDocumentOwner = async (profileId: string, documentId: string) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) {
            console.log("Document not found");
            throw new Error("Document not found");
        }
        if(document.ownerId.toString() !== profileId) {
            console.log("Unauthorized");
            throw new Error("Unauthorized");
        }
    } catch (error) {
        console.log("Error asserting document", error);
        throw new Error("Assertion failed");
    }
}

export const assertNotDocumentOwner = async (profileId: string, documentId: string) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) {
            console.log("Document not found");
            throw new Error("Document not found");
        }
        if(document.ownerId.toString() === profileId) {
            console.log("Unauthorized");
            throw new Error("Unauthorized");
        }
    } catch (error) {
        console.log("Error asserting not document owner", error);
        throw new Error("Assertion failed");
    }
}

export const assertCanReadDocument = async (profileId: string, documentId: string) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) {
            console.log("Document not found");
            throw new Error("Document not found");
        }

        const collaborator = await Collaborator.findOne({documentId, profileId});
        if(!collaborator && document.ownerId.toString() !== profileId) {
            console.log("Unauthorized");
            throw new Error("Unauthorized");
        }
    } catch (error) {
        console.log("Error asserting can read document", error);
        throw new Error("Assertion failed");
    }
}

export const assertCanWriteDocument = async (profileId: string, documentId: string) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) {
            console.log("Document not found");
            throw new Error("Document not found");
        }

        const collaborator = await Collaborator.findOne({documentId, profileId});
        if(document.ownerId.toString() !== profileId && collaborator?.role !== "editor") {
            console.log("Unauthorized");
            throw new Error("Unauthorized");
        }
    } catch (error) {
        console.log("Error asserting can write document", error);
        throw new Error("Assertion failed");
    }
}

export const fetchEnrichedCollaborators = async (documentId: string) => {
    try {
        const document = await Document.findById(documentId);
        if(!document) {
            console.log("Document not found");
            throw new Error("Document not found");
        }
        const collaborators = await Collaborator.find({documentId});
        const collIds = collaborators.map(coll => coll.profileId.toString());
        const profiles = await Profile.find({_id: {$in: [...collIds, document.ownerId]}}).lean();
        const owner = profiles.find((profile: ProfileType) => profile._id.equals(document.ownerId));
        const mapped = collaborators.map(coll => {
            const profile = profiles.find((profile: ProfileType) => profile._id.equals(coll.profileId));
            if(!profile) return null;
            return {
                _id: coll._id.toString(),
                name: `${profile.firstName} ${profile.lastName}`.trim(),
                permissions: coll.role === "editor" ? ["read", "write"] : ["read"],
            }
        }).filter(Boolean);
        if(owner) {
            mapped.push({
                _id: owner._id.toString(),
                name: `${owner.firstName} ${owner.lastName}`.trim(),
                permissions: ["read", "write"],
            })
        }
        return mapped;
    } catch (error) {
        console.log("Error fetching enriched collaborators", error);
        throw new Error("Assertion failed");
    }
}