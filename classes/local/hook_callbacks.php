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
use core\hook\output\before_standard_top_of_body_html_generation;

/**
 * Render once per Moodle page and initialise through Moodle AMD requirements.
 */
final class hook_callbacks {
    /** @var \WeakMap|null Pages whose widget markup was already rendered in this request. */
    private static ?\WeakMap $rendered = null;

    /** @var \WeakMap|null Pages whose early snippet was already rendered in this request. */
    private static ?\WeakMap $bootstrapped = null;

    /**
     * Add the widget only to eligible normal HTML output.
     * @param before_footer_html_generation $hook Footer hook
     */
    public static function before_footer_html_generation(before_footer_html_generation $hook): void {
        if (self::is_transport_excluded()) {
            return;
        }
        $hook->add_html(self::get_footer_html($hook->renderer));
    }

    /**
     * Add the early snippet that lets saved adjustments reach the first paint.
     * @param before_standard_top_of_body_html_generation $hook Top of body hook
     */
    public static function before_standard_top_of_body_html_generation(
        before_standard_top_of_body_html_generation $hook
    ): void {
        if (self::is_transport_excluded()) {
            return;
        }
        $hook->add_html(self::get_bootstrap_html($hook->renderer));
    }

    /**
     * CLI, AJAX, web-service and maintenance responses never receive the widget.
     * @return bool Whether the request is excluded
     */
    private static function is_transport_excluded(): bool {
        global $CFG;
        return (defined('CLI_SCRIPT') && CLI_SCRIPT) || (defined('AJAX_SCRIPT') && AJAX_SCRIPT) ||
            (defined('WS_SERVER') && WS_SERVER) || !empty($CFG->maintenance_enabled);
    }

    /**
     * Validated settings when the current page may show the widget.
     * @return array|null Settings, or null when the page is not eligible
     */
    private static function eligible_config(): ?array {
        global $CFG, $PAGE;
        $config = configuration::normalise(get_config('local_sisaccessibility'));
        try {
            $path = $PAGE->url->out_as_local_url(false);
        } catch (\coding_exception $exception) {
            // Accessibility enhancement must not interrupt an unusual nonlocal page.
            return null;
        }
        $allowed = page_policy::allows(
            $config,
            $PAGE->pagelayout,
            $path,
            (int) ($PAGE->course->id ?? 0),
            $CFG->admin
        );
        return $allowed ? $config : null;
    }

    /**
     * Build markup once per page; separate from transport guards for integration tests.
     * @param \renderer_base $renderer Current page renderer
     * @return string Eligible widget markup or an empty string
     */
    public static function get_footer_html(\renderer_base $renderer): string {
        global $PAGE;
        $config = self::eligible_config();
        if ($config === null) {
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

    /**
     * Build the early snippet once per page: colour-vision filter definitions and, when browser
     * persistence is enabled, the script that restores the saved adjustments before the first paint.
     * @param \renderer_base $renderer Current page renderer
     * @return string Snippet or an empty string
     */
    public static function get_bootstrap_html(\renderer_base $renderer): string {
        global $PAGE;
        $config = self::eligible_config();
        if ($config === null) {
            return '';
        }
        self::$bootstrapped = self::$bootstrapped ?? new \WeakMap();
        if (isset(self::$bootstrapped[$PAGE])) {
            return '';
        }
        self::$bootstrapped[$PAGE] = true;
        return $renderer->render_from_template(
            'local_sisaccessibility/bootstrap',
            configuration::bootstrap_context($config)
        );
    }
}
