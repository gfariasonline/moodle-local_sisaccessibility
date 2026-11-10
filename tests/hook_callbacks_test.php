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
 * Tests for eligible Moodle pages.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility;

use local_sisaccessibility\local\hook_callbacks;

/**
 * Verify output handoff and single initialisation.
 *
 * @covers \local_sisaccessibility\local\hook_callbacks
 */
final class hook_callbacks_test extends \advanced_testcase {
    public function test_configuration_is_html_data_and_amd_receives_no_arguments(): void {
        global $PAGE;
        $this->resetAfterTest();
        $this->setGuestUser();
        set_config('enabled', 1, 'local_sisaccessibility');
        $originalpage = $PAGE;
        $requires = new class {
            /** @var array Captured module initialisations. */
            public array $calls = [];
            /**
             * Capture a requirements call.
             * @param string $module Module name
             * @param string $method Method name
             * @param array $arguments Module arguments
             */
            public function js_call_amd($module, $method, $arguments = []) {
                $this->calls[] = [$module, $method, $arguments];
            }
        };
        $PAGE = (object) [
            'pagelayout' => 'standard', 'course' => (object) ['id' => 1], 'requires' => $requires,
            'url' => new class {
                /**
                 * Return a local eligible path.
                 * @return string Local path
                 */
                public function out_as_local_url() {
                    return '/';
                }
            },
        ];
        $renderer = $this->getMockBuilder(\renderer_base::class)->disableOriginalConstructor()
            ->onlyMethods(['render_from_template'])->getMock();
        $renderer->expects($this->once())->method('render_from_template')
            ->with('local_sisaccessibility/widget', $this->callback(static function ($context) {
                $data = json_decode($context['config'], true, 512, JSON_THROW_ON_ERROR);
                return isset($data['scope'], $data['labels']['title']);
            }))->willReturn('<div id="sis-a11y-root"></div>');
        try {
            $this->assertStringContainsString('sis-a11y-root', hook_callbacks::get_footer_html($renderer));
            $this->assertSame('', hook_callbacks::get_footer_html($renderer));
            $this->assertSame([['local_sisaccessibility/init', 'init', []]], $requires->calls);
            $this->assertLessThan(1024, strlen(json_encode($requires->calls[0][2])));
        } finally {
            $PAGE = $originalpage;
        }
    }
    public function test_nonlocal_page_url_does_not_interrupt_output_or_schedule_javascript(): void {
        global $PAGE;
        $this->resetAfterTest();
        set_config('enabled', 1, 'local_sisaccessibility');
        $originalpage = $PAGE;
        $PAGE = (object) [
            'pagelayout' => 'standard', 'course' => (object) ['id' => 1],
            'requires' => new class {
                /**
                 * No requirements call is expected for a nonlocal URL.
                 */
                public function js_call_amd() {
                    throw new \LogicException('Unexpected AMD initialisation');
                }
            },
            'url' => new class {
                /**
                 * Simulate Moodle rejecting an external page URL.
                 * @return string Never returns
                 */
                public function out_as_local_url() {
                    throw new \coding_exception('URL is not local');
                }
            },
        ];
        $renderer = $this->getMockBuilder(\renderer_base::class)->disableOriginalConstructor()
            ->onlyMethods(['render_from_template'])->getMock();
        $renderer->expects($this->never())->method('render_from_template');
        try {
            $this->assertSame('', hook_callbacks::get_footer_html($renderer));
        } finally {
            $PAGE = $originalpage;
        }
    }

    /**
     * Minimal page for the early snippet: an eligible local standard page.
     * @return object Page stand-in
     */
    private function early_page(): object {
        return (object) [
            'pagelayout' => 'standard', 'course' => (object) ['id' => 1],
            'url' => new class {
                /**
                 * Return a local eligible path.
                 * @return string Local path
                 */
                public function out_as_local_url() {
                    return '/';
                }
            },
        ];
    }

    public function test_early_snippet_is_rendered_once_with_json_literals_and_the_session_key(): void {
        global $PAGE;
        $this->resetAfterTest();
        $this->setGuestUser();
        set_config('enabled', 1, 'local_sisaccessibility');
        $originalpage = $PAGE;
        $PAGE = $this->early_page();
        $renderer = $this->getMockBuilder(\renderer_base::class)->disableOriginalConstructor()
            ->onlyMethods(['render_from_template'])->getMock();
        $renderer->expects($this->once())->method('render_from_template')
            ->with('local_sisaccessibility/bootstrap', $this->callback(static function ($context) {
                $key = json_decode($context['key'], true, 512, JSON_THROW_ON_ERROR);
                $tools = json_decode($context['tools'], true, 512, JSON_THROW_ON_ERROR);
                $colours = json_decode($context['colours'], true, 512, JSON_THROW_ON_ERROR);
                return $key === \local_sisaccessibility\local\configuration::storage_scope() &&
                    $tools === \local_sisaccessibility\local\configuration::TOOLS &&
                    $colours === \local_sisaccessibility\local\configuration::COLOURS &&
                    str_contains($context['filters'], 'sis-a11y-deuteranopia');
            }))->willReturn('<script></script>');
        try {
            $this->assertSame('<script></script>', hook_callbacks::get_bootstrap_html($renderer));
            $this->assertSame('', hook_callbacks::get_bootstrap_html($renderer));
        } finally {
            $PAGE = $originalpage;
        }
    }

    public function test_early_snippet_is_skipped_on_pages_without_the_widget(): void {
        global $PAGE;
        $this->resetAfterTest();
        $originalpage = $PAGE;
        $PAGE = $this->early_page();
        $renderer = $this->getMockBuilder(\renderer_base::class)->disableOriginalConstructor()
            ->onlyMethods(['render_from_template'])->getMock();
        $renderer->expects($this->never())->method('render_from_template');
        try {
            set_config('enabled', 0, 'local_sisaccessibility');
            $this->assertSame('', hook_callbacks::get_bootstrap_html($renderer));
            set_config('enabled', 1, 'local_sisaccessibility');
            $PAGE->pagelayout = 'embedded';
            $this->assertSame('', hook_callbacks::get_bootstrap_html($renderer));
        } finally {
            $PAGE = $originalpage;
        }
    }

    public function test_early_snippet_renders_script_only_when_browser_persistence_is_on(): void {
        global $OUTPUT;
        $this->resetAfterTest();
        $this->setGuestUser();
        $on = $OUTPUT->render_from_template(
            'local_sisaccessibility/bootstrap',
            \local_sisaccessibility\local\configuration::bootstrap_context(
                \local_sisaccessibility\local\configuration::normalise((object) ['persist' => '1'])
            )
        );
        $this->assertStringContainsString('<script>', $on);
        $this->assertStringContainsString(\local_sisaccessibility\local\configuration::storage_scope(), $on);
        $this->assertStringContainsString('id="sis-a11y-filters"', $on);
        $this->assertStringNotContainsString('{{', $on);
        $off = $OUTPUT->render_from_template(
            'local_sisaccessibility/bootstrap',
            \local_sisaccessibility\local\configuration::bootstrap_context(
                \local_sisaccessibility\local\configuration::normalise((object) ['persist' => '0'])
            )
        );
        $this->assertStringNotContainsString('<script', $off);
        $this->assertStringContainsString('id="sis-a11y-filters"', $off, 'the filters are needed even without persistence');
        $none = $OUTPUT->render_from_template(
            'local_sisaccessibility/bootstrap',
            \local_sisaccessibility\local\configuration::bootstrap_context(
                \local_sisaccessibility\local\configuration::normalise((object) ['tools' => 'bold'])
            )
        );
        $this->assertStringNotContainsString('sis-a11y-filters', $none);
    }
}
