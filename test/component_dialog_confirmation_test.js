require('./setup');
const expect = require('chai').expect;

describe("Confirmation Dialog", function() {

  const DialogConfirmation = require('../app/javascript/src/component_dialog_confirmation');
  const CANCEL_TEXT = "Dialog says Cancel";
  const OK_TEXT = "Dialog says Ok";
  const ACTIVATOR_CLASSES = "activator-classname and-some-activator";
  const BUTTON_CLASSES = "button-classname and-some-button";
  const DIALOG_CLASSES = "dialog-classname and-some-dialog";
  const DIALOG_ID = "component-dialog-confirmation-test-id";
  const CONTAINER_ID = "component-dialog-confirmation-test-container";
  var dialog;

  before(function() {
    // jQuyery is present in document because the
    // components use it, so we can use it here.

    var $container = $("<div></div>");
    var $dialog = $(`<div class="component component-dialog-confirmation">
          <h3 data-node="heading" class="heading">General heading here</h3>
          <p data-node="content">General message here</p>
        </div>`);

    $dialog.attr("id", DIALOG_ID);
    $container.attr("id", CONTAINER_ID);
    $container.append($dialog);
    $(document.body).append($container);

    dialog = new DialogConfirmation($dialog, {
      autoOpen: false,
      cancelText: CANCEL_TEXT,
      okText: OK_TEXT,
      classes: {
        "ui-activator": ACTIVATOR_CLASSES,
        "ui-button": BUTTON_CLASSES,
        "ui-dialog": DIALOG_CLASSES
      }
    });
  });

  after(function() {
    $("#" + DIALOG_ID).dialog("destroy");
    $("#" + CONTAINER_ID).remove();
  });

  describe("HTML", function() {
    it("should have the basic HTML in place", function() {
      expect($("#" + DIALOG_ID).length).to.equal(1);
    });

    it("should NOT have the Dialog class name present", function() {
      expect($("#" + DIALOG_ID).parents(".Dialog").length).to.equal(0);
    });

    it("should have the DialogConfirmation class name present", function() {
      expect($("#" + DIALOG_ID).parents(".DialogConfirmation").length).to.equal(1);
    });

    it("should have action two buttons", function() {
      var $parent = $("#" + DIALOG_ID).parents(".DialogConfirmation");
      var $buttons = $parent.find(".ui-dialog-buttonset button");
      expect($buttons.length).to.equal(2);
    });
  });

  describe("Config", function() {
    it("should apply CSS classnames passed in config", function() {
       var $parent = $("#" + DIALOG_ID).parents(".DialogConfirmation");
       expect($parent.get(0).className).to.include(DIALOG_CLASSES);
    });

    it("should use config.okText as OK button text", function() {
       var $button = $("[role='dialog']").find(".ui-dialog-buttonset button");
       expect($button.eq(0).text()).to.include(OK_TEXT);
    });

    it("should use config.cancelText as Cancel button text", function() {
       var $button = $("[role='dialog']").find(".ui-dialog-buttonset button");
       expect($button.eq(1).text()).to.include(CANCEL_TEXT);
    });
  });


  describe("Properties", function() {
    it("should make the $node public", function() {
      expect(dialog.$node).to.exist;
      expect(dialog.$node.length).to.equal(1);
    });

    it("should make the instance available as data on the $node", function() {
      var $node = $("#" + DIALOG_ID);
      expect($node).to.exist;
      expect($node.length).to.equal(1);
      expect($node.data("instance")).to.equal(dialog);
    });

    it("should make (public but indicated as) private reference to elements", function() {
      expect(dialog._elements).to.exist;

      expect(dialog._elements.heading).to.exist;
      expect(dialog._elements.heading.length).to.equal(1);

      expect(dialog._elements.content).to.exist;
      expect(dialog._elements.content.length).to.equal(1);

      expect(dialog._elements.ok).to.exist;
      expect(dialog._elements.ok.length).to.equal(1);

      expect(dialog._elements.cancel).to.exist;
      expect(dialog._elements.cancel.length).to.equal(1);
    });

    it("should make (public but indicated as) private reference to config", function() {
      expect(dialog._config).to.exist;
      expect(dialog._config.okText).to.equal(OK_TEXT);
    });

    it("should make (public but indicated as) private reference to action", function() {
      expect(dialog._action).to.exist;
      expect(typeof dialog._action).to.equal("function");
    });
  });


  describe("Content", function() {
    it("should return default text with content method", function() {
      var text = dialog.content;

      expect(text.heading).to.equal("General heading here");
      expect(text.content).to.equal("General message here");
      expect(text.ok).to.equal("Dialog says Ok");
    });
  });
});
