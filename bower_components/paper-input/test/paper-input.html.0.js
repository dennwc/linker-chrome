
    function getIronInput(paperInput) {
      return paperInput.inputElement;
    }
    function getNativeInput(paperInput) {
      return Polymer.Element ? paperInput.inputElement.inputElement : paperInput.inputElement;
    }
    function getFloatingLabel(paperInput) {
      return Polymer.dom(Polymer.dom(paperInput.root).querySelector('paper-input-container').root)
          .querySelector('.label-is-floating');
    }
    function getErrorDiv(paperInput) {
      return Polymer.dom(paperInput.root).querySelector('paper-input-error')
    }
    function getCharCounterDiv(paperInput) {
      return Polymer.dom(paperInput.root).querySelector('paper-input-char-counter')
    }

    function ensureDocumentHasFocus() {
      window.top && window.top.focus();
      window.focus();
    }

    suite('basic', function() {
      test('setting value sets the input value', function(done) {
        var input = fixture('basic');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.value = 'foobar';
          assert.equal(getIronInput(input).value, input.value, 'iron-input value equals input.value');
          assert.equal(getNativeInput(input).value, input.value, 'iron-getNativeInput(input) value equals input.value');
          done();
        }, 1);
      });

      test('placeholder does not overlap label', function(done) {
        var input = fixture('placeholder');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          assert.equal(getNativeInput(input).placeholder, input.placeholder, 'inputElement.placeholder equals input.placeholder');
          assert.equal(input.noLabelFloat, false);
          assert.ok(getFloatingLabel(input));
          done();
        }, 1);
      });

      test('special types autofloat the label', function(done) {
        var input = fixture('date');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          // Browsers that don't support special <input> types like `date` fallback
          // to `text`, so make sure to only test if type is still preserved after
          // the element is attached.
          if (getNativeInput(input).type === "date") {
            assert.equal(input.alwaysFloatLabel, true);
            assert.ok(getFloatingLabel(input));
          }
          done();
        }, 1);
      });

      test('always-float-label attribute works without placeholder', function() {
        var input = fixture('always-float-label');
        var container = Polymer.dom(input.root).querySelector('paper-input-container');
        var inputContent = Polymer.dom(container.root).querySelector('.input-content');
        assert.isTrue(inputContent.classList.contains('label-is-floating'), 'label is floating');
      });

      test('label does not receive pointer events', function() {
        var input = fixture('always-float-label');
        var label = Polymer.dom(input.root).querySelector('label');
        assert.equal(getComputedStyle(label).pointerEvents, 'none');
      });

      test('error message is displayed', function() {
        var input = fixture('error');
        var errorDiv = getErrorDiv(input);
        assert.notEqual(getComputedStyle(error).visibility, 'hidden', 'error is not visibility:hidden');
      });

      test('character counter is displayed', function(done) {
        var input = fixture('basic-char-counter');

        // Need to wait a tick to stamp the char-counter.
        Polymer.Base.async(function() {
          var counter = getCharCounterDiv(input);
          assert.ok(counter, 'paper-input-char-counter exists');
          assert.equal(counter._charCounterStr, input.value.length, 'character counter shows the value length');
          done();
        }, 1);
      });

      test('character counter is correct for type=number', function(done) {
        var input = fixture('type-number-char-counter');

        // Need to wait a tick to stamp the char-counter.
        Polymer.Base.async(function() {
          var counter = getCharCounterDiv(input)
          assert.ok(counter, 'paper-input-char-counter exists');
          assert.equal(counter._charCounterStr, input.value.toString().length, 'character counter shows the value length');
          done();
        }, 1);
      });

      test('validator is used', function(done) {
        var input = fixture('validator');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          assert.ok(getIronInput(input).invalid, 'input is invalid');
          done();
        }, 1);
      });

      test('caret position is preserved', function() {
        var input = fixture('basic');
        var ironInput = getIronInput(input);
        input.value = 'nananana';
        ironInput.selectionStart = 2;
        ironInput.selectionEnd = 2;

        input.updateValueAndPreserveCaret('nanananabatman');

        assert.equal(ironInput.selectionStart, 2, 'selectionStart is preserved');
        assert.equal(ironInput.selectionEnd, 2, 'selectionEnd is preserved');
      });

      test('setting autofocus to true implictly acquires focus', function(done) {
        var input = fixture('basic');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          var inputFocusSpy = sinon.spy(getNativeInput(input), 'focus');
          window.setTimeout(function() {
            assert(inputFocusSpy.called);
            done();
          }, 50);
          input.autofocus = true;

        }, 1);
      });
    });

    suite('focus/blur events', function() {
      var input;
      var inputFocusSpy, blurFocusSpy;

      setup(function() {
        input = fixture('basic');
        inputFocusSpy = sinon.spy();
        blurFocusSpy = sinon.spy();

        input.addEventListener('focus', inputFocusSpy);
        input.addEventListener('blur', blurFocusSpy);
      });

      teardown(function() {
        input.removeEventListener('focus', inputFocusSpy);
        input.removeEventListener('blur', blurFocusSpy);
      });

      // When you focus a paper-input, this is what happens:
      // paper-input gets focused -> it focuses its nested <input>
      // In shadow DOM, the nested <input>'s focus event stays inside the shadow root.
      // In shady DOM, this is a different event (it blurs the paper-input and fires
      // another focus event for the 'input (which we retarget).
      // This means that in Shady DOM, you get *two* focus events (and a blur)
      // every time a paper-input is focused.
      test('focus events fired on host element', function(done) {
        // Mutation observer is async, so wait one tick.
        var testThis = this;
        Polymer.Base.async(function() {
          ensureDocumentHasFocus();
          // If the document doesn't have focus, we can't test focus.
          if (!window.top.document.hasFocus()) {
            testThis.skip();
          }
          input.focus();
          assert(input.focused, 'input is focused');
          assert(inputFocusSpy.callCount > 0, 'focus event fired');
          done();
        }, 1);
      });

      test('focus events fired on host element if nested element is focused', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }
        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          getNativeInput(input).focus();
          assert(input.focused, 'input is focused');
          assert(inputFocusSpy.callCount > 0, 'focus event fired');
          done();
        }, 1);
      });

      test('blur events fired on host element', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.focus();
          assert(input.focused, 'input is focused');
          assert(inputFocusSpy.callCount > 0, 'focus event fired');
          var blursBecauseOfFocus = blurFocusSpy.callCount;

          // We can't call blur() on the paper-input, because in shady dom
          // it's not actually the element that's focused (the nested <input>)
          // is. So, next best thing, blur the thing that's focused.
          document.activeElement.blur();
          input.blur();
          assert(blurFocusSpy.callCount > blursBecauseOfFocus, 'blur event fired');
          done();
        }, 1);
      });

      test('blur events fired on host element nested element is blurred', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.focus();
          assert(inputFocusSpy.callCount > 0, 'focus event fired');

          var blursBecauseOfFocus = blurFocusSpy.callCount;
          getNativeInput(input).blur();
          assert(blurFocusSpy.callCount > blursBecauseOfFocus, 'blur event fired');
          done();
        }, 1)
      });

      test('focusing then bluring sets the focused attribute correctly', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }
        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.focus();
          assert(input.focused, 'input is focused');
          getNativeInput(input).blur();
          assert(!input.focused, 'input is blurred');
          getNativeInput(input).focus();
          assert(input.focused, 'input is focused');
          getNativeInput(input).blur();
          assert(!input.focused, 'input is blurred');
          done();
        }, 1);
      });

      test('focusing then bluring with shift-tab removes the focused attribute correctly', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }
        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.focus();
          assert(input.focused, 'input is focused');

          // Fake a shift-tab induced blur by forcing the flag.
          input._shiftTabPressed = true;
          getNativeInput(input).blur();
          assert(!input.focused, 'input is blurred');
          done();
        }, 1);
      });
    });

    suite('focused styling (integration test)', function(done) {
      test('underline is colored when input is focused', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }

        var input = fixture('basic');
        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          var container = Polymer.dom(input.root).querySelector('paper-input-container');
          var line = Polymer.dom(container.root).querySelector('.underline');
          assert.isFalse(line.classList.contains('is-highlighted'), 'line is not highlighted when input is not focused');

          input.focus();
          requestAnimationFrame(function() {
            assert.isTrue(line.classList.contains('is-highlighted'), 'line is highlighted when input is focused');
            done();
          });
        }, 1);
      });
    });

    suite('validation', function() {

      test('invalid attribute updated after calling validate()', function(done) {
        var input = fixture('required-no-auto-validate');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.validate();

          // Need to wait a tick to stamp the error message.
          Polymer.Base.async(function() {
            var error = getErrorDiv(input);
            assert.ok(error, 'paper-input-error exists');
            assert.notEqual(getComputedStyle(error).visibility, 'hidden', 'error is not visibility:hidden');
            assert.isTrue(input.invalid, 'invalid is true');
            done();
          }, 1);
        }, 1);
      });
    });

    suite('a11y', function() {
      test('has aria-labelledby, which is monotonically increasing', function(done) {
        var inputs = fixture('multiple-inputs');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          // Find the first index of the input in this fixture. Since the label
          // ids monotonically increase every time a new input is created, and
          // this fixture isn't the first one in the document, we're going to start
          // at an ID > 1.
          var firstLabel = Polymer.dom(inputs[0].root).querySelector('label').id;
          var index = parseInt(firstLabel.substr(firstLabel.lastIndexOf('-') + 1));

          for (var i = 0; i < inputs.length; i++ ) {
            var input = getNativeInput(inputs[i]);
            var label = Polymer.dom(inputs[i].root).querySelector('label').id;

            assert.isTrue(input.hasAttribute('aria-labelledby'));
            assert.equal(label, 'paper-input-label-' + (index++));
            assert.equal(input.getAttribute('aria-labelledby'), label);
          }
          done();
        }, 1)
      });

      test('has aria-describedby for error message', function(done) {
        var input = fixture('required');

        // Need to wait a tick to stamp the error message.
        Polymer.Base.async(function() {
          assert.isTrue(getNativeInput(input).hasAttribute('aria-describedby'));
          assert.equal(getNativeInput(input).getAttribute('aria-describedby'), getErrorDiv(input).id, 'aria-describedby points to the error message');
          done();
        }, 1);
      });

      test('has aria-describedby for character counter', function(done) {
        var input = fixture('basic-char-counter');

        // Need to wait a tick to stamp the char-counter.
        Polymer.Base.async(function() {
          assert.isTrue(getNativeInput(input).hasAttribute('aria-describedby'));
          assert.equal(getNativeInput(input).getAttribute('aria-describedby'), getCharCounterDiv(input).id, 'aria-describedby points to the character counter');
          done();
        }, 1);
      });

      test('has aria-describedby for character counter and error', function(done) {
        var input = fixture('required-char-counter');

        // Need to wait a tick to stamp the char-counter and error message.
        Polymer.Base.async(function() {
          assert.isTrue(getNativeInput(input).hasAttribute('aria-describedby'));
          var ariaDescribedBy = getNativeInput(input).getAttribute('aria-describedby');

          assert.notEqual(ariaDescribedBy.indexOf(getErrorDiv(input).id, -1,
              'aria-describedby points to the error message'));
          assert.notEqual(ariaDescribedBy.indexOf(getCharCounterDiv(input).id, -1,
              'aria-describedby points to the character counter'));
          done();
        }, 1);
      });

      test('focus an input with tabindex', function(done) {
        ensureDocumentHasFocus();
        // If the document doesn't have focus, we can't test focus.
        if (!window.top.document.hasFocus()) {
          this.skip();
        }

        var input = fixture('has-tabindex');

        // Mutation observer is async, so wait one tick.
        Polymer.Base.async(function() {
          input.focus();
          assert.equal(input.shadowRoot ? input.shadowRoot.activeElement :
                  document.activeElement, input._focusableElement);
          done();
        }, 1);
      });
    });

    // TODO(nowaldorf): This currently crashes on Firefox/Safari.
    a11ySuite('basic');
    a11ySuite('label');
    a11ySuite('label-has-value');
    a11ySuite('error');
  