<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EmailTemplate;
use Illuminate\Http\Request;

class EmailTemplateController extends Controller
{
    /**
     * Get all email templates
     */
    public function index()
    {
        $templates = EmailTemplate::all();
        
        return response()->json([
            'success' => true,
            'data' => $templates,
        ]);
    }

    /**
     * Get a single email template
     */
    public function show(EmailTemplate $emailTemplate)
    {
        return response()->json([
            'success' => true,
            'data' => $emailTemplate,
        ]);
    }

    /**
     * Update an email template
     */
    public function update(Request $request, EmailTemplate $emailTemplate)
    {
        $validated = $request->validate([
            'subject' => ['required', 'string', 'max:255'],
            'body' => ['required', 'string'],
            'description' => ['nullable', 'string', 'max:500'],
            'isActive' => ['sometimes', 'boolean'],
        ]);

        $emailTemplate->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Email template updated successfully.',
            'data' => $emailTemplate,
        ]);
    }

    /**
     * Get available variables for a template type
     */
    public function getVariables($templateType)
    {
        $template = EmailTemplate::where('templateType', $templateType)->first();
        
        if (!$template) {
            return response()->json([
                'success' => false,
                'message' => 'Template not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'variables' => $template->variables ?? [],
            'description' => 'Available variables for email replacement. Use {variable_name} in the template.',
        ]);
    }
}
