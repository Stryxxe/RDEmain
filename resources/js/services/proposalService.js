import axios from "axios";

const axiosInstance = window.axios || axios;

if (!window.axios) {
    axiosInstance.defaults.withCredentials = true;
    axiosInstance.defaults.baseURL = `${window.location.origin}/api`;
}

/**
 * Update a proposal (CM and RDD can edit proposals)
 * @param {number} proposalId - The proposal ID
 * @param {Object} data - The update data
 * @returns {Promise} - The API response
 */
export const updateProposal = async (proposalId, data) => {
    try {
        // Check if any files are included (updatedForm, setiFile, gadFile, matrixFile, supportingDocuments)
        const hasFile = data.updatedForm && data.updatedForm instanceof File;
        const hasSetiFile = data.setiFile && data.setiFile instanceof File;
        const hasGadFile = data.gadFile && data.gadFile instanceof File;
        const hasMatrixFile =
            data.matrixFile && data.matrixFile instanceof File;
        const hasSupportingDocs =
            Array.isArray(data.supportingDocuments) &&
            data.supportingDocuments.some((file) => file instanceof File);
        const hasImages =
            data.revisionImages &&
            Array.isArray(data.revisionImages) &&
            data.revisionImages.length > 0;

        const hasAnyFile =
            hasFile ||
            hasSetiFile ||
            hasGadFile ||
            hasMatrixFile ||
            hasSupportingDocs ||
            hasImages;

        let payload;
        let headers = { Accept: "application/json" };

        if (hasAnyFile) {
            payload = new FormData();

            // Append all fields to FormData
            Object.keys(data).forEach((key) => {
                if (data[key] !== null && data[key] !== undefined) {
                    if (key === "revisionImages" && Array.isArray(data[key])) {
                        // Append each image file separately
                        data[key].forEach((file, index) => {
                            if (file instanceof File) {
                                payload.append(
                                    `revisionImages[${index}]`,
                                    file
                                );
                            }
                        });
                    } else if (
                        key === "supportingDocuments" &&
                        Array.isArray(data[key])
                    ) {
                        // Append supporting documents as array
                        data[key].forEach((file, index) => {
                            if (file instanceof File) {
                                payload.append("supportingDocuments[]", file);
                            }
                        });
                    } else if (Array.isArray(data[key])) {
                        // For other arrays (researchAgenda, dostSPs, etc.), JSON stringify
                        payload.append(key, JSON.stringify(data[key]));
                    } else if (data[key] instanceof File) {
                        // Append file directly
                        payload.append(key, data[key]);
                    } else {
                        // Append other values - ensure statusID is sent as integer
                        if (key === "statusID") {
                            payload.append(key, parseInt(data[key], 10));
                        } else {
                            payload.append(key, data[key]);
                        }
                    }
                }
            });

            // Don't set Content-Type header - let browser set it with boundary
            // headers['Content-Type'] = 'multipart/form-data';
        } else {
            payload = data;
            headers["Content-Type"] = "application/json";
        }

        const response = await axiosInstance.put(
            `/proposals/${proposalId}`,
            payload,
            {
                headers,
                withCredentials: true,
            }
        );

        return response.data;
    } catch (error) {
        console.error("Error updating proposal:", error);
        throw error;
    }
};

/**
 * Get a specific proposal by ID
 * @param {number} proposalId - The proposal ID
 * @returns {Promise} - The API response
 */
export const getProposal = async (proposalId) => {
    try {
        const response = await axiosInstance.get(`/proposals/${proposalId}`, {
            headers: { Accept: "application/json" },
            withCredentials: true,
        });

        return response.data;
    } catch (error) {
        console.error("Error fetching proposal:", error);
        throw error;
    }
};

export default {
    updateProposal,
    getProposal,
};
