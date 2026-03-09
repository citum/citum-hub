/* tslint:disable */
/* eslint-disable */

export function decide(intent_json: string): string;

export function generate_style(intent_json: string): string;

export function render_bibliography(style_yaml: string, refs_json: string): string;

export function render_citation(style_yaml: string, refs_json: string, citation_json: string, mode?: string | null): string;

export function render_intent_citation(intent_json: string, refs_json: string, citation_json: string, mode?: string | null): string;
