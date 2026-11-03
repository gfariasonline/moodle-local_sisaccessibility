@local @local_sisaccessibility @javascript
Feature: Use the SIS Accessibility panel
  In order to adjust the presentation of course content
  As a visitor
  I can open and reset the local accessibility panel

  Scenario: A visitor opens the panel and restores the default presentation
    Given I am on homepage
    When I click on ".sis-a11y-launcher" "css_element"
    Then "#sis-a11y-panel[open]" "css_element" should exist
    When I click on "[data-tool='bold']" "css_element"
    Then "[data-tool='bold'][aria-pressed='true']" "css_element" should exist
    When I click on "[data-action='reset']" "css_element"
    Then "[data-tool='bold'][aria-pressed='false']" "css_element" should exist
    When I click on ".sis-a11y-close" "css_element"
    Then "#sis-a11y-panel[open]" "css_element" should not exist

  Scenario: Disabled plugin does not render an accessibility panel
    Given the following config values are set as admin:
      | enabled | 0 | local_sisaccessibility |
    When I am on homepage
    Then "#sis-a11y-root" "css_element" should not exist

  Scenario: Empty tool selection hides the panel
    Given the following config values are set as admin:
      | tools | | local_sisaccessibility |
    When I am on homepage
    Then "#sis-a11y-root" "css_element" should not exist
