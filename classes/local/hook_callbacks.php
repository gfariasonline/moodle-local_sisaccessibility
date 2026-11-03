<?php
// This file is part of Moodle - https://moodle.org/
//
// Moodle is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// Moodle is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with Moodle.  If not, see <https://www.gnu.org/licenses/>.

/**
 * Footer hook integration.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

use core\hook\output\before_footer_html_generation;

/**
 * Render once per Moodle page and initialise through Moodle AMD requirements.
 */
final class hook_callbacks {
    /** @var \WeakMap|null Pages already rendered in this request. */
    private static ?\WeakMap $rendered = null;

    /**
     * Add the widget only to eligible normal HTML output.
     * @param before_footer_html_generation $hook Footer hook
     */
    public static function before_footer_html_generation(before_footer_html_generation $hook): void {
        global $CFG;
        if (
            (defined('CLI_SCRIPT') && CLI_SCRIPT) || (defined('AJAX_SCRIPT') && AJAX_SCRIPT) ||
                (defined('WS_SERVER') && WS_SERVER) || !empty($CFG->maintenance_enabled)
        ) {
            return;
        }
        $hook->add_html(self::get_footer_html($hook->renderer));
    }

    /**
     * Build markup once per page; separate from transport guards for integration tests.
     * @param \renderer_base $renderer Current page renderer
     * @return string Eligible widget markup or an empty string
     */
    public static function get_footer_html(\renderer_base $renderer): string {
        global $CFG, $PAGE;
        $config = configuration::normalise(get_config('local_sisaccessibility'));
        try {
            $path = $PAGE->url->out_as_local_url(false);
        } catch (\coding_exception $exception) {
            // Accessibility enhancement must not interrupt an unusual nonlocal page.
            return '';
        }
        if (
            !page_policy::allows(
                $config,
                $PAGE->pagelayout,
                $path,
                (int) ($PAGE->course->id ?? 0),
                $CFG->admin
            )
        ) {
            return '';
        }
        self::$rendered = self::$rendered ?? new \WeakMap();
        if (isset(self::$rendered[$PAGE])) {
            return '';
        }
        $html = $renderer->render_from_template(
            'local_sisaccessibility/widget',
            configuration::template_context($config)
        );
        $PAGE->requires->js_call_amd('local_sisaccessibility/init', 'init');
        self::$rendered[$PAGE] = true;
        return $html;
    }
}
