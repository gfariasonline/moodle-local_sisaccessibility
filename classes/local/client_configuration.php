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
 * Browser-side configuration and anonymous storage scope.
 *
 * @package    local_sisaccessibility
 * @copyright  2026 Thiago Serrão
 * @license    https://www.gnu.org/copyleft/gpl.html GNU GPL v3 or later
 */

namespace local_sisaccessibility\local;

/**
 * Turns validated settings into what the browser receives; nothing administrator-provided reaches it unchecked.
 */
final class client_configuration {
    /**
     * Create a stable random session scope. The owner ID never leaves the server.
     * @return string Namespaced storage key
     */
    public static function storage_scope(): string {
        global $CFG, $SESSION, $USER;
        $owner = empty($USER->id) ? 'visitor' : (isguestuser() ? 'guest' : 'user:' . (int) $USER->id);
        $scope = $SESSION->local_sisaccessibility ?? null;
        if (
            !is_array($scope) || ($scope['owner'] ?? '') !== $owner ||
                !preg_match('/^[a-f0-9]{32}$/D', $scope['nonce'] ?? '')
        ) {
            $scope = ['owner' => $owner, 'nonce' => bin2hex(random_bytes(16))];
            $SESSION->local_sisaccessibility = $scope;
        }
        return 'local_sisaccessibility:v1:' . substr(hash('sha256', $CFG->wwwroot), 0, 16) . ':' . $scope['nonce'];
    }

    /**
     * Clear transient state on authentication changes, including logout/login to the same account.
     */
    public static function reset_scope(): void {
        global $SESSION;
        unset($SESSION->local_sisaccessibility);
    }

    /**
     * Prepare the public configuration without policy-only fields or account identifiers.
     * @param array $config Validated settings
     * @return array Public configuration
     */
    public static function for_client(array $config): array {
        foreach (['enabled', 'showlogin', 'showadmin', 'excludedcourses'] as $name) {
            unset($config[$name]);
        }
        $config['scope'] = self::storage_scope();
        $config['language'] = current_language();
        $config['languages'] = self::installed_languages($config['language']);
        $config['logourl'] = (new \moodle_url('/local/sisaccessibility/pix/sis-logo.png'))->out(false);
        $config['labels'] = [];
        foreach (array_merge(configuration::TOOLS, configuration::LABELS) as $name) {
            $config['labels'][$name] = get_string($name, 'local_sisaccessibility');
        }
        return $config;
    }

    /**
     * Installed language packs for the interface language selector.
     * @param string $current Current language, always offered so the selector never lists nothing
     * @return array Language names indexed by code
     */
    public static function installed_languages(string $current): array {
        $languages = [];
        foreach (get_string_manager()->get_list_of_translations() as $code => $name) {
            $languages[(string) $code] = (string) $name;
        }
        return $languages ?: [$current => $current];
    }

    /**
     * Pass translated configuration through escaped HTML rather than AMD arguments.
     * @param array $config Validated settings
     * @return array Mustache context, escaped by the template's double braces
     */
    public static function template_context(array $config): array {
        return ['config' => json_encode(
            self::for_client($config),
            JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR
        )];
    }

    /**
     * Prepare the early snippet. Values are JSON literals with every HTML-significant character escaped, so the
     * template can print them unescaped inside its script.
     * @param array $config Validated settings
     * @return array Mustache context
     */
    public static function bootstrap_context(array $config): array {
        $flags = JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_APOS | JSON_HEX_QUOT | JSON_THROW_ON_ERROR;
        $colours = array_values(array_intersect(configuration::COLOURS, $config['tools']));
        return [
            'key' => $config['persist'] && $config['tools'] ? json_encode(self::storage_scope(), $flags) : '',
            'tools' => json_encode($config['tools'], $flags),
            'colours' => json_encode($colours, $flags),
            'filters' => colour_vision::svg($config['tools']),
        ];
    }
}
