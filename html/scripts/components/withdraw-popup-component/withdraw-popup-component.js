import Utils from "./../../libs/utils.js";
import * as consts from "./../../consts/consts.js"; 

class WithdrawPopupComponent extends HTMLElement {
    componentParams = {
      loaded: 0,
      rate: 0,
      isAllocation: 0,
      maxValue: 0,
      isValid: true
    }

    constructor() {
      super();
    }

    getRateStr(value) {
        const rateVal = Utils.formateValue(new Big(value).times(this.componentParams.rate));
        return (this.componentParams.rate > 0 && value > 0
          ? (rateVal > 0.1 ? (Utils.numberWithSpaces(rateVal) + ' USD') : '< 1 cent')
          : '0 USD');
    }

    getTemplate() {
        const TEMPLATE =
        `<div class="popup">
            <div class="popup__content withdraw-tmpl">
                <div class="popup__content__title">Withdraw</div>
                <div class="popup__value">
                    <div class="popup__value__input-area">
                        <div class="withdraw-area__input">
                            <input type="text" class="withdraw-area__input__elem" oncontextmenu="return false"
                                placeholder="0" id="withdraw-input"/>
                            <span class="withdraw-area__input__text">
                                ${this.componentParams.isAllocation > 0 ? 'BEAMX' : 'BEAM'}
                            </span>
                        </div>
                        <div class="withdraw-area__add-max" id="add-max-control">
                            <img class="withdraw-area__add-max__icon" src="./icons/add-max-icon.svg"/>
                            <div class="withdraw-area__add-max__text">max</div>
                        </div>
                    </div>
                    <div class="withdraw-area__rate" id="withdraw-input-rate">
                        0 USD
                    </div>
                    <div class="withdraw-area__fee">
                        <div class="withdraw-area__fee__title">Fee</div>
                        <div class="withdraw-area__fee__value">
                            <div class="withdraw-area__fee__value__beam">
                                ${consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM} BEAM
                            </div>
                            <div class="withdraw-area__fee__value__rate">
                                ${ this.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM) }
                            </div>
                        </div>
                    </div>
                    <div class="ivalid-state-message" id="max-value-invalid">
                        Insufficient funds to complete the transaction.<br>
                        Maximum amount is 
                        ${Utils.numberWithSpaces(Utils.formateValue(this.componentParams.maxValue))} BEAM.
                    </div>
                    
                </div>
                <div class="withdraw-area__controls">
                    <button class="container__main__controls__cancel ui-button" id="withdraw-cancel">
                        <span class="ui-button__inner-wrapper">
                            <div class="ui-button__icon">
                                <img src="./icons/icon-cancel.svg"/>
                            </div>
                            <span class="ui-button__text cancel-text">cancel</span>
                        </span>
                    </button>
                    <button class="withdraw-area__controls__withdraw ui-button" id="withdraw-confirm">
                        <span class="ui-button__inner-wrapper">
                            <div class="ui-button__icon">
                                <img src="./icons/icon-withdraw.svg"/>
                            </div>
                            <span class="ui-button__text confirm-text">withdraw</span>
                        </span>
                    </button>
                </div>
            </div>
        </div>`;

      return TEMPLATE;
    }
  
    render() {
        if (this.componentParams.loaded > 0) {
            this.innerHTML = this.getTemplate();
            $('#max-value-invalid').hide();

            $('#withdraw-cancel').click(() => {
                $('withdraw-popup-component').hide();
            });

            $('#withdraw-confirm').click(() => {
                if (this.componentParams.isValid) {
                    let event = new CustomEvent("global-event", {
                        detail: {
                        type: 'withdraw-process',
                        is_allocation: this.componentParams.isAllocation,
                        amount: (Big($('#withdraw-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed()
                        }
                    });
                    document.dispatchEvent(event);
                    $('withdraw-popup-component').hide();
                }
            })

            $('.popup__content.withdraw-tmpl').css('height', 'unset');
            $('withdraw-popup-component').show();

            $('#withdraw-input').on('input', (event) => {
                const value = $('#withdraw-input').val();
                $('#withdraw-input-rate').text(this.getRateStr(value.length > 0 ? value : 0));

                this.componentParams.isValid = parseFloat(value.length > 0 ? value : 0) 
                    < parseFloat(this.componentParams.maxValue.toFixed());
                if (this.componentParams.isValid) {
                    this.setValidState();
                } else {
                    $('#max-value-invalid').show();
                    $('.withdraw-area__fee, .withdraw-area__rate').hide();
                    $('.withdraw-area__inputб .withdraw-area__input__text').addClass('invalid');
                    $('.withdraw-area__input__elem, .withdraw-area__controls__withdraw').addClass('invalid');
                }
             });

            $('#withdraw-input').keydown((event) => {
                const specialKeys = [
                    'Backspace', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
                    'Control', 'Delete', 'F5'
                  ];

                if (specialKeys.indexOf(event.key) !== -1) {
                    return;
                }

                const current = $('#withdraw-input').val();
                const next = current.concat(event.key);
            
                if (!Utils.handleString(next)) {
                    event.preventDefault();
                }
            })

            $('#withdraw-input').bind('paste', (event) => {
                const text = event.clipboardData.getData('text');
                if (!Utils.handleString(text)) {
                    event.preventDefault();
                }
            })

            $('#add-max-control').click(() => {
                $('#withdraw-input').val(this.componentParams.maxValue);
                $('#withdraw-input-rate').text(this.getRateStr(this.componentParams.maxValue));
                this.componentParams.isValid = true;
                this.setValidState();
            })

            Utils.loadStyles();
        }
    };

    setValidState() {
        $('#max-value-invalid').hide();
        $('.withdraw-area__fee, .withdraw-area__rate').show();
        $('.withdraw-area__input, .withdraw-area__input__text').removeClass('invalid');
        $('.withdraw-area__input__elem, .withdraw-area__controls__withdraw').removeClass('invalid');
    }
  
    connectedCallback() {
      this.render();
    }
    
    attributeChangedCallback(name, oldValue, newValue) {    
        if (name === 'loaded') {
            this.componentParams.loaded = newValue;
            this.render();
        } else if (name === 'is_allocation') {
            this.componentParams.isAllocation = newValue;
        } else if (name === 'rate') {
            this.componentParams.rate = newValue;
        } else if (name === 'max_val') {
            let value = Big(newValue).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
            this.componentParams.maxValue = value;
        }
    }
  
    
    static get observedAttributes() {
      return ['loaded', 'is_allocation', 'rate', 'max_val'];
    }
  }

  customElements.define('withdraw-popup-component', WithdrawPopupComponent);
