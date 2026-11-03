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
}
