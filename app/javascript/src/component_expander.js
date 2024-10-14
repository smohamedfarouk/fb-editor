/**
 * Expander Component
 * ----------------------------------------------------
 * Description:
 * Creates an area that expands and contracts, triggered by an activator element.
 *
 * Implements the following behaviour:
 *  - Takes a provided element, and enhances the content within it to be a
*  disclosure widget either by enhancing the provided element, or by
*  creating a button.
*   - If config.wrap_content is true, it will wrap all other child elements
*   within the provided element in a <div>
*   - By default, it will collapse and hide the content.
*
*   Example:
*   Given the following:
*   <dl>
*     <dt>Title</dt>
*     <dd>Loem ipsum dolor sit amet consecteteur adipiscing elit...</dd>
*   </dl>
*   <script>
*     var $list = $(dl);
*     new Expander($list, {
*       activator_source: $(dl).find('> dt').first(),
*       wrap_content: false,
*     })
*   </script>
*
*   Would result the following markup:
*   <dl class="Expander close">
*     <dt class="Expander__title">
*       <button aria-expanded="false" aria-controls="Expander_12345678790">Title</button>
*     </dt>
*     <dd id="Expander_1234567890" class="Expander__container" style="display: none;">
*       Lorem ipsum.....
*     </dd>
*   </dt>
*
*   Configuration:
*   The config object can have the follwoing properties:
*   - activator_source: (jQuery|string) If a jQuery object it should be the first child of
*                                the $node. If the element itself is not a button, 
*                                the element will be enhanced by wrapping its contents 
*                                with a <button>.
*                                If a string is provided, a button will be created and
*                                prepended to the $node using the title text as the
*                                button label.
*   - wrap_content: (boolean)    If true will wrap all content of the
*                                $node aside from the $activator with a wrapper <div>
*   - auto_open: (boolean)       If true, the component will be open on page load. 
*   - persist: (boolean)         Should the open/close state be persisted in
*                                localStorage
*   - id: (string)               Provide an optional id for the component,
*                                otherwise a unique id will be generated. Must
*                                be provided if persist option is enabled as the
*                                id is used as the localStorage key
*   - duration: (integer)        The duration in ms of the open/close animation.
*
 **/

const { 
  mergeObjects,
  uniqueString,
  storageAvailable,
} = require('./utilities');

/**
 * @param $node (jQuery) Html Element to be enhanced.
 * @param condif (Object) Key/value pairs for config (see above)
**/

class Expander {
  #browserControlled;
  #config;
  #state;
  #id;

  static STATE_OPEN = "open";
  static NATIVE_CONTROL_ATTRIBUTE = "open";

  constructor($content, config) {
    const conf = mergeObjects({
      activator_source: "activate", // Developer mistake occured if see this text.
      wrap_content: true && !$content.is("details"), // Default is true unless detect <details> in use.
      auto_open: false,
      persist: false,
      duration: 0,
    }, config);

    if(conf.persist === true && !conf.id) {
      console.error('You must provide an `id` in Expander component config when using `persist`.')
      conf.persist = false;
    }

    this.#config = conf;
    this.#state = ""; // This value always get overwritten by openState
    this.#id = conf.id || uniqueString("Expander_");
    this.#browserControlled = false; // Will be changed in createNode if $content is <details> element
    this.$node = this.#createNode($content);
    this.$activator = this.#createActivator();
   
    this.setInitialState();
  }

  set openState(open) {
    if(open) {
      this.$activator.attr("aria-expanded", "true");
      this.#state = Expander.STATE_OPEN;
    }
    else {
      this.$activator.attr("aria-expanded", "false");
      this.#state = 'closed';
    }
  }

  open() {
    if(this.#browserControlled) {
      this.$node.attr(Expander.NATIVE_CONTROL_ATTRIBUTE, true);
      this.openState = true;
    }
    else {
      this.$node.slideDown( this.#config.duration, () => {
        this.openState = true;
      });
    }
  }

  close() {
    if(this.#browserControlled) {
      this.$node.attr(Expander.NATIVE_CONTROL_ATTRIBUTE, false);
      this.openState = false;
    }
    else {
      this.$node.slideUp( this.#config.duration, () => {
        this.openState = false;
      });
    }
  }

  isOpen() {
    return this.#state == Expander.STATE_OPEN;
  }

  toggle() {
    this.isOpen() ? this.close() : this.open();
    if(this.#config.persist && storageAvailable("localStorage")) {
      localStorage.setItem(this.#id, this.#state)
    }
  }

  setInitialState() {
    let previousState;

    if(storageAvailable('localStorage')) {
      previousState = window.localStorage.getItem(this.#id)
    }

    if(this.#config.persist && previousState) {
      previousState == 'open' ? this.open() : this.close()
    } else {
      this.#config.auto_open ? this.open() : this.close();
    }
  }

  /* Create/define activator element to use from the source provided
   * in the config.
   *
   * Note:
   * var source (String|jQuery element) is text or element used to acquire an activator.
   *
   * If source is:
   *  - String
   *    Create a <button> and place before the content.
   *
   *  - <button>
   *    Just use/enhance that.
   *
   *  - Empty element
   *    Treat it like a button (no extra support).
   *
   *  - Non-empty element
   *    Wrap it's text content with a button, and replace the content of source
   *    element (it is assumed no other elements are inside the source but this
   *    method will prevent trying to add elements inside a button.
   *
   **/
  #createActivator() {
    var source = this.#config.activator_source;
    var $activator;
    var activatorEventType;

    if(typeof source == 'string') {
      $activator = $('<button>' + source + '</button>');
      $activator.attr("type", "button");
      this.$node.before($activator);
    }
    else {
      // Assume source to be jQuery element from this point.
      if(this.#isValidActivatorElement(source)) {
        $activator = source;
      }
      else {
        if(source.children().length < 0 || this.#browserControlled) {
          // No extra support for Empty element, yet.
          // Note that we set browser_controlled in createNode so, if it
          // has a value of true, then we also added <summary> as source.
          $activator = source;
        }
        else {
          $activator = $('<button>' + source + '</button>');
          $activator.attr("type", "button");
          $activator.text(source.text()); // Only want text not child elements.
          source.empty();
          source.append($activator);
        }
      }
    }

    // Now we should have a suitable element we can do the rest.
    $activator.addClass('Expander__activator');
    $activator.attr({
      'aria-expanded': this.#config.auto_open,
      'aria-controls': this.#id
    });

    // If required, add the Expander.toggle() for open/close control.
    if(!this.#browserControlled) {
      activatorEventType = this.#isInput($activator) ? 'change' : 'click';
      $activator.on(activatorEventType, (e) => {
        this.toggle();
      });
    }

    return $activator;
  }


  /* Depending on the markup we're using, and our preferred end result, we either
   * want to wrap the $content in a container DIV or just leave the $content to
   * become act as the wrapper of the Expander. The wrapper element (or existing
   * $content element, will be returned as the $node for the component.
   *
   * e.g. You wouldn't need a wrapper if your intention is this...
   *
   * <dl
   *  <dt class="this-becomes-the-activator">Blah</dt>
   *  <dd class="this-is-the-content this-becomes-the-$node">Blah Blah</dd>
   * </dt>
   *
   * but you would want it for this outcome...
   *
   * <section class="this-was-the-content">
   *   <h2 class="this-was-activator-source"><button class="inserted-activator">Blah</h2>
   *   <div class="created-wrapper-becomes-the-$node">
   *     <p>Blah</p>
   *     <p>Blah</p>
   *   </div>
   * </section>
   *
   *
   **/
  #createNode($content) {
    var $node;

    if(this.#config.wrap_content) {
      $node = $("<div></div>");
      $content.append($node);

      // In case config.activator_source was an element inside the $node
      // and is either going to be the $activator or wrapping it, filter it out.
      $node.append($content.children().not(this.#config.activator_source));
    }
    else {

      if($content.is("details")) {
        // We're going to hand over to native browser functionality
        // but supporting Expander needs to allow for some extras.
        this.#browserControlled = true;
        this.#config.activator_source = $content.find("summary");

        $content.on("toggle", (e) => {
          this.openState = e.currentTarget.open;
        });
      }

      // Change nothing as node is either <details> or another desired container.
      $node = $content;
    }

    $node.addClass("Expander");
    $node.data("instance", this);
    $node.attr("id", this.#id);

    return $node;
  }

  #isValidActivatorElement(source) {
    return source.is('button') || source.is('summary') || this.#isInput(source);
  }

  #isInput($activator) {
   return $activator.is('input[type="checkbox"]') || $activator.is('input[type="radio"]') || $activator.is('input[type="dropdown2"]')
  }

}

module.exports = Expander;
