// Copyright 2026 Thiago Serrão. GNU GPL v3 or later.
/** @module local_sisaccessibility/profiles */
// Functional presets independently implemented using the plugin's local tools. A profile is offered only when
// every tool it needs is enabled. Colour tools are mutually exclusive, so a profile names at most one.
export const profiles = [
    {id: 'seizure-safe', label: 'profile_seizure_safe', state: {animations: true, lowsaturation: true}},
    {id: 'visually-impaired', label: 'profile_visually_impaired',
        state: {highcontrast: true, fontsize: 1.2, cursor: true, dyslexia: true, links: true}},
    {id: 'adhd-friendly', label: 'profile_adhd_friendly', state: {guide: true, animations: true, hideimages: true}},
    {id: 'cognitive-learning', label: 'profile_cognitive_learning',
        state: {dyslexia: true, headings: true, links: true, letterspacing: true, lineheight: true}},
    {id: 'dyslexia', label: 'profile_dyslexia',
        state: {dyslexia: true, letterspacing: true, lineheight: true, guide: true}},
    {id: 'colour-blind', label: 'profile_colour_blind', state: {deuteranopia: true, links: true}},
    {id: 'senior', label: 'profile_senior', state: {fontsize: 1.4, bold: true, lineheight: true, cursor: true}},
    {id: 'motor', label: 'profile_motor', state: {cursor: true, links: true, fontsize: 1.2}},
    {id: 'night', label: 'profile_night', state: {darkcontrast: true}},
];
