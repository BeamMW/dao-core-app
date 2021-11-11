import Utils from "./libs/utils.js";
import * as consts from "./consts/consts.js";

const CONTRACT_ID = "fd8b7c05e90b7442989c2393e53b3b2ad760d828e7c39522000c10e6274e3076";
const REJECTED_CALL_ID = -32021;
const IN_PROGRESS_ID = 5;
const TIMEOUT = 3000;

class DaoCore {
    constructor() {
        this.switcherValues = {
            'm-switch-one-week': {
                value: '1 w',
                fullValue: '1 week',
                height: 10080,
                wCount: 1,
            },
            'm-switch-two-weeks': {
                value: '2 w',
                fullValue: '2 week',
                height: 20160,
                wCount: 2,
            },
            'm-switch-one-month': {
                value: '1 M',
                fullValue: '1 Month',
                height: 43200,
                wCount: 4.4,
            },
            'm-switch-two-months': {
                value: '2 M',
                fullValue: '2 Month',
                height: 86400,
                wCount: 8.8,
            },
            'm-switch-three-months': {
                value: '3 M',
                fullValue: '3 Month',
                height: 129600,
                wCount: 13.2,
            }
        }


        this.timeout = undefined;
        this.pluginData = {
            inTransaction: false,
            lockedBeams: 0,
            stake: 0,
            inProgress: false,
            mainLoaded: false,
            beamTotalLocked: 0,
            farmTotal: 0,
            vestingStart: null,
            vestingEnd: null,
            farmTotal: null,
            farmAvail: null,
            farmReceived: null,
            rate: 0,
            inputTimer: null,
            max_val: 0,
            switcherSelectedValue: this.switcherValues['m-switch-one-week'],
            prevSwitcherValue: 'm-switch-one-week',
            isWVAlid: true,
            m_calc_is_exp: true,
            is_gov_expanded: true,
        }
    }

    getRate = () => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'https://api.coingecko.com/api/v3/simple/price?ids=beam&vs_currencies=usd');
        xhr.send();
        xhr.onload = () => {
            if (xhr.status === 200) {
                const response = JSON.parse(xhr.response);
                if (response.beam !== undefined && response.beam.usd !== undefined) {
                    $('staking-component').attr('rate', response.beam.usd);
                    $('withdraw-popup-component').attr('rate', response.beam.usd);
                    $('deposit-popup-component').attr('rate', response.beam.usd);
                    this.pluginData.rate = response.beam.usd;
                }
            }
        };
    }

    setError = (error, context) => {
        let errorElementId = "#error-common";
        if ($('#main-page').css('display') === 'none') {
            errorElementId = "#error-full";
            $('#error-full-container').show();
        } else {
            $('#error-common').show();
        }

        $(errorElementId).text(JSON.stringify(error) + ' --- ' + context);
        if (this.timeout) {
            clearTimeout(this.timeout);   
        }
        this.timeout = setTimeout(() => {
            $(errorElementId).text(JSON.stringify(error) + ' --- ' + context);
            this.start();
        }, TIMEOUT)
    }

    applyStyles = () => {
        const styles = Utils.getStyles();
        const topColor =  [styles.appsGradientOffset, "px,"].join('');
        const mainColor = [styles.appsGradientTop, "px,"].join('');
        
        $('body').css('background-image', [
            "linear-gradient(to bottom,",
            styles.background_main_top, topColor,
            styles.background_main, mainColor,
            styles.background_main
        ].join(' '));
        $('body').css('background-repeat', 'no-repeat');
        $('body').css('background-attachment', 'fixed');
        
        document.body.style.color = styles.content_main;
        document.querySelectorAll('.popup').forEach(item => {
            item.style.backgroundImage = `linear-gradient(to bottom,
            ${Utils.hex2rgba(styles.background_main_top, 0.6)} ${topColor}
            ${Utils.hex2rgba(styles.background_main, 0.6)} ${mainColor}
            ${Utils.hex2rgba(styles.background_main, 0.6)}`;
        });
        
        document.querySelectorAll('.popup__content').forEach(item => {
            item.style.backgroundColor = Utils.hex2rgba(styles.background_popup, 1);
        });

        document.getElementById('error-full').style.color = styles.validator_error;
        document.getElementById('error-common').style.color = styles.validator_error;
    }

    start = () => {
        Utils.download("./daoCore.wasm", (err, bytes) => {
            if (err) {
                let errTemplate = "Failed to load shader,";
                let errMsg = [errTemplate, err].join(" ");
                return this.setError(errMsg);
            }
    
            Utils.invokeContract("role=manager,action=farm_view,cid=" + CONTRACT_ID, 
                (...args) => this.onFarmViewLoaded(...args), bytes);

            this.hidePopups();
            this.applyStyles();
            this.getRate();
            setInterval(() => {
                this.getRate();
            }, 30000);
        })
    }

    onFarmViewLoaded = (err, res) => {
        if (res.farming.h >= res.farming.h0) {
            this.showStaking();
        } else {
            this.showStakingTimer(res.farming.h0 - res.farming.h);
        }
    
        const stakingComponent = $('staking-component');
        stakingComponent.attr('beam-value', res.user.beams_locked);
        stakingComponent.attr('beamx-value', res.user.beamX);
        
        this.pluginData.lockedBeams = res.user.beams_locked;

        this.loadPreallocated();
    }

    loadPreallocated = () => {
        Utils.invokeContract("role=manager,action=prealloc_view,cid=" + CONTRACT_ID, 
            (...args) => this.onPreallocatedLoaded(...args));
    }

    onPreallocatedLoaded = (err, res) => {
        if (res.total !== undefined) {
            const component = $('allocation-component');
            component.attr('total', res.total);
            component.attr('received', res.received);
            component.attr('avail_total', res.avail_total);
            component.attr('locked', res.total - res.avail_total);
            component.attr('remaining', res.avail_remaining);
            component.attr('vesting_start', res.vesting_start);
            component.attr('vesting_end', res.vesting_end);
            component.attr('cur_height', res.h);
            this.pluginData.vestingStart = res.vesting_start;
            this.pluginData.vestingEnd = res.vesting_end;
            this.loadBlockInfo(res.h);
        } else {
            $('allocation-component').hide();
        }

        this.loadFarmStats();
    }

    loadFarmStats = () => {
        Utils.invokeContract("role=manager,action=farm_totals,cid=" + CONTRACT_ID, 
            (...args) => this.onFarmTotalsLoaded(...args));
    }

    onFarmTotalsLoaded = (err, res) => {
        this.pluginData.farmTotal = res.total;
        this.pluginData.farmAvail = res.avail;
        this.pluginData.farmReceived = res.received;

        $('staking-component').attr('beam_total_locked', res.beam_locked);
        this.loadPreallocStats();
    }

    loadPreallocStats = () => {
        Utils.invokeContract("role=manager,action=prealloc_totals,cid=" + CONTRACT_ID, 
            (...args) => this.onPreallocTotalsLoaded(...args));
    }

    onPreallocTotalsLoaded = (err, res) => {
        const govComponent = $('governance-component')
        const availTotal = res.avail + this.pluginData.farmAvail;
        const receivedTotal = res.received + this.pluginData.farmReceived;
        const total = res.total + this.pluginData.farmTotal;
        const availRes = availTotal - receivedTotal;
        const locked = total - availTotal;

        govComponent.attr('total', total);
        govComponent.attr('avail', availRes > 0 ? availRes : 0);
        govComponent.attr('locked', locked > 0 ? locked : 0);
        govComponent.attr('distributed', receivedTotal);

        $('allocation-component').attr('allocated', res.total);
    }

    onFarmGetYieldLoaded = (err, res) => {
        if (!Utils.isMobile()) {
            const depositComponent = this.pluginData.yieldType === 'deposit' 
                ? $('deposit-popup-component')
                : $('staking-component');
            depositComponent.attr('yeild', res.yield);
        } else {
            if (this.pluginData.yieldType === 'deposit') {
                this.mobileYieldUpdate(res.yield);
            } else {
                $('staking-component').attr('yeild', res.yield);
            }
        }
    }

    mobileYieldUpdate = (data) => {
        const yieldVal = Big(data).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
        const weeklyRewardStr = yieldVal.div(daoCore.pluginData.switcherSelectedValue.wCount);
        
        $('#m-deposit-weekly-reward').text((parseFloat(weeklyRewardStr) > 0 
            ? Utils.numberWithCommas(Utils.formateValue(weeklyRewardStr)) 
            : '0') + ' BEAMX');
        $('#m-deposit-estimation').text(
            (parseFloat(yieldVal) > 0 
            ? Utils.numberWithCommas(Utils.formateValue(yieldVal)) 
            : '0') + ' BEAMX');
    }
    
    refresh = (now) => {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        this.timeout = setTimeout(() => {
            Utils.invokeContract("role=manager,action=farm_view,cid=" + CONTRACT_ID, 
                (...args) => this.onFarmViewLoaded(...args));
        }, now ? 0 : 3000)
    }

    showStakingTimer = (hDiff) => {
        const d = Math.floor(hDiff / (60*24));
        const h = Math.floor(hDiff % (60*24) / 60);
        const m = Math.floor(hDiff % 60);

        $('#timer-days-value').text(d);
        $('#timer-hours-value').text(h);
        $('#timer-minutes-value').text(m);

        $('#bg').show();
        $('#staking-timer').show();
        this.refresh(false);
    }

    showStaking = () => {
        if (!this.pluginData.mainLoaded) {
            this.pluginData.mainLoaded = true;
            $('#staking-timer').remove();
            $('#bg').show();
            
            // $('#main-page').remove();
            // $('#main-page-mobile').show();
            
            if (Utils.isMobile()) {
                $('#main-page').remove();
                $('#main-page-mobile').show();
            } else if (!Utils.isMobile() && (Utils.isWeb() || Utils.isDesktop())) {
                $('#main-page-mobile').remove();
                $('#main-page').show();
            }
            
            $('#staking-page').hide();
            $('#staking-page-back').hide();
            $('#error-full-container').hide();
            $('#error-common').hide();
            $('staking-component').attr('loaded', this.pluginData.mainLoaded | 0);

            if (Utils.isMobile()) {
                daoCore.pluginData.is_gov_expanded ? $('#gov-content').show() : $('#gov-content').hide();
                
                $('#gov-area-icon').show();
                $('#gov-area-icon').on('click', () => {
                daoCore.pluginData.is_gov_expanded = !daoCore.pluginData.is_gov_expanded;
                daoCore.pluginData.is_gov_expanded ? $('#gov-content').show() : $('#gov-content').hide();
                $("#gov-area-icon").attr("src", daoCore.pluginData.is_gov_expanded ? "./icons/mobile-arrow-down.svg" 
                    : "./icons/mobile-arrow-up.svg");
                })
            }
        }
        this.refresh(false);
    }

    loadBlockInfo = (height) => {
        return Utils.callApi('block_details', {
            height
        }, (...args) => this.onBlockInfoLoaded(...args));
    }

    onBlockInfoLoaded = (err, res) => {
        const component = $('allocation-component');
        component.attr('timestamp', res.timestamp);
    }

    onMakeTx (err, sres, full) {
        if (err) {
            return this.setError(err, "Failed to generate transaction request")
        }

        Utils.callApi(
            'process_invoke_data', {data: full.result.raw_data}, 
            (...args) => {}
        )
    }

    onMyXIDLoaded = (err, res) => {
        $('public-key-popup-component').attr('key', res.xid);
    }

    onApiResult(err, res, full) {
        if (err) {
            return this.setError(err,  "API handling error")
        }

        if (full.id == 'ev_txs_changed') {   
            let inTx = false            
            let txs = full.result.txs
            
            for (let tx of txs) {
                if (tx.status == 0 || tx.status == 1 || tx.status == 5) {
                    inTx = true
                    break
                }
            }

            return
        }

        if (full.id == 'ev_system_state') {
            // we update our data on each block
            //this.refreshAllData()
            return
        }

        //this.setError(full, "Unexpected API result")
    }

    hidePopups() {
        $('public-key-popup-component').hide();
        $('claim-rewards-popup-component').hide();
        $('deposit-popup-component').hide();
        $('withdraw-popup-component').hide();
        $('info-popup-component').hide();
    }

    triggerYeildCalc() {
        let event = new CustomEvent("global-event", {
            detail: {
            type: 'calc-yeild',
            from: 'deposit',
            amount: (Big(+$('#m-deposit-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed(),
            hPeriod: this.pluginData.switcherSelectedValue.height
            }
        });
        document.dispatchEvent(event);
    }
}

const daoCore = new DaoCore();
Utils.initialize({
        "appname": "BEAM DAO Core",
        "min_api_version": "6.1",
        "apiResultHandler": (...args) => daoCore.onApiResult(...args)
    },
    (err) => {
        if (err) {
            daoCore.setError(err);
            return
        }

        daoCore.start();

        document.addEventListener('global-event', (e) => { 
            if (e.detail.type === 'deposit-process') {
                Utils.invokeContract("role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                    ",bLockOrUnlock=1,amountBeam=" + e.detail.amount, 
                    (...args) => daoCore.onMakeTx(...args));
            } else if (e.detail.type === 'withdraw-process') {
                if (e.detail.is_allocation > 0) {
                    Utils.invokeContract("role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                        ",amount=" + e.detail.amount, 
                        (...args) => daoCore.onMakeTx(...args));
                } else {
                    Utils.invokeContract("role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                        ",bLockOrUnlock=0,amountBeam=" + e.detail.amount, 
                        (...args) => daoCore.onMakeTx(...args));
                }
            } else if (e.detail.type === 'show-public-key') {
                Utils.invokeContract("role=manager,action=my_xid", 
                    (...args) => daoCore.onMyXIDLoaded(...args));
            } else if (e.detail.type === 'claim-rewards-process') {
                if (e.detail.is_allocation > 0) {
                    Utils.invokeContract("role=manager,action=prealloc_withdraw,cid=" + CONTRACT_ID + 
                        ",amount=" + e.detail.amount, 
                        (...args) => daoCore.onMakeTx(...args));
                } else {
                    Utils.invokeContract("role=manager,action=farm_update,cid=" + CONTRACT_ID + 
                        ",bLockOrUnlock=0,amountBeamX=" + e.detail.amount, 
                        (...args) => daoCore.onMakeTx(...args));
                }
            } else if (e.detail.type === 'deposit-popup-open') {
                $('deposit-popup-component').attr('loaded', daoCore.pluginData.mainLoaded | 0);
            } else if (e.detail.type === 'withdraw-popup-open') {
                const component = $('withdraw-popup-component');
                component.attr('is_allocation', e.detail.is_allocation | 0);
                component.attr('max_val', daoCore.pluginData.lockedBeams);
                component.attr('loaded', daoCore.pluginData.mainLoaded | 0);
            } else if (e.detail.type === 'calc-yeild') {
                daoCore.pluginData.yieldType = e.detail.from;
                
                Utils.invokeContract("role=manager,action=farm_get_yield,cid=" + CONTRACT_ID + ",amount=" + 
                    e.detail.amount + ",hPeriod=" + e.detail.hPeriod, 
                    (...args) => daoCore.onFarmGetYieldLoaded(...args));
            } else if (e.detail.type === 'deposit-mobile-open') {
                $('#main-page-mobile').hide();
                $('#deposit-mobile-page').show();
                window.scrollTo( 0, 0 );

                $('#m-deposit-fee-rate').text(Utils.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM, daoCore.pluginData.rate));

                $('#m-switch-one-week').attr('hval', daoCore.switcherValues['m-switch-one-week'].height);
                $('#m-switch-one-week').text(daoCore.switcherValues['m-switch-one-week'].value);
                $('#m-switch-two-weeks').attr('hval', daoCore.switcherValues['m-switch-two-weeks'].height);
                $('#m-switch-two-weeks').text(daoCore.switcherValues['m-switch-two-weeks'].value);
                $('#m-switch-one-month').attr('hval', daoCore.switcherValues['m-switch-one-month'].height);
                $('#m-switch-one-month').text(daoCore.switcherValues['m-switch-one-month'].value);
                $('#m-switch-two-months').attr('hval', daoCore.switcherValues['m-switch-two-months'].height);
                $('#m-switch-two-months').text(daoCore.switcherValues['m-switch-two-months'].value);
                $('#m-switch-three-months').attr('hval', daoCore.switcherValues['m-switch-three-months'].height);
                $('#m-switch-three-months').text(daoCore.switcherValues['m-switch-three-months'].value);
                $('#m-selector-value').text(daoCore.switcherValues['m-switch-one-week'].value);

                
                daoCore.pluginData.m_calc_is_exp ? $('#calc-area').show() : $('#calc-area').hide();

                $('#calc-area-icon').click(() => {
                    daoCore.pluginData.m_calc_is_exp = !daoCore.pluginData.m_calc_is_exp;
                    daoCore.pluginData.m_calc_is_exp ? $('#calc-area').show() : $('#calc-area').hide();
                    $("#calc-area-icon").attr("src", daoCore.pluginData.m_calc_is_exp ? "./icons/mobile-arrow-down.svg" 
                        : "./icons/mobile-arrow-up.svg");
                });

                $('.m-switch__item').click((event) => {
                    let targetItem = $(event.target);
                    if (daoCore.pluginData.prevSwitcherValue) {
                        let prevItem = $('#'+daoCore.pluginData.prevSwitcherValue);
                        prevItem.text(daoCore.pluginData.switcherSelectedValue.value);
                        prevItem.css('min-width', '25px');
                    }
                    daoCore.pluginData.switcherSelectedValue = daoCore.switcherValues[targetItem.attr('id')];
                    targetItem.text(daoCore.pluginData.switcherSelectedValue.fullValue);
                    targetItem.css('min-width', '50px');
                    let selectorItem = $('.m-selector');
                    selectorItem.text(daoCore.pluginData.switcherSelectedValue.fullValue);
                    selectorItem.width(targetItem.width() + 29);
                    selectorItem.css('left', targetItem.position().left - 1);
                    
                    daoCore.pluginData.prevSwitcherValue = targetItem.attr('id');
                    daoCore.triggerYeildCalc();
                })

                $('#m-deposit-input').on('input', (e) => {
                    const value = $('#m-deposit-input').val();
                    $('#m-deposit-input-rate').text(Utils.getRateStr(value.length > 0 ? value : 0, daoCore.pluginData.rate));
                    if(daoCore.pluginData.inputTimer) {
                        clearTimeout(daoCore.pluginData.inputTimer);
                    }
    
                    if (value > 15) {
                        daoCore.triggerYeildCalc();
                    } else {
                        $('#m-deposit-weekly-reward').text('0 BEAMX');
                        $('#m-deposit-estimation').text('0 BEAMX');
                    }
                });
    
                $('#m-deposit-input').keydown((event) => {
                    const specialKeys = [
                        'Backspace', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
                        'Control', 'Delete', 'F5'
                      ];
    
                    if (specialKeys.indexOf(event.key) !== -1) {
                        return;
                    }
    
                    const current = $('#m-deposit-input').val();
                    const next = current.concat(event.key);
                
                    if (!Utils.handleString(next)) {
                        event.preventDefault();
                    }
                });
    
                $('#m-deposit-input').bind('paste', (event) => {
                    if (event.clipboardData !== undefined) {
                        const text = event.clipboardData.getData('text');
                        if (!Utils.handleString(text)) {
                            event.preventDefault();
                        }
                    }
                });

                const onCancel = () => {
                    $('#main-page-mobile').show();
                    $('#deposit-mobile-page').hide();
                    $('#m-deposit-input').val('');

                    $('#m-deposit-weekly-reward').text('0 BEAMX');
                    $('#m-deposit-estimation').text('0 BEAMX');

                    daoCore.pluginData.switcherSelectedValue = daoCore.switcherValues['m-switch-one-week'];
                    daoCore.pluginData.prevSwitcherValue = 'm-switch-one-week';
                }

                $('#m-deposit-cancel').click(onCancel);
    
                $('#m-deposit-confirm').click(() => {
                    let event = new CustomEvent("global-event", {
                        detail: {
                          type: 'deposit-process',
                          amount: (Big(+$('#m-deposit-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed()
                        }
                      });
                    document.dispatchEvent(event);
                    onCancel();
                });
            } else if (e.detail.type === 'withdraw-mobile-open') {
                $('#main-page-mobile').hide();
                $('#withdraw-mobile-page').show();
                window.scrollTo( 0, 0 );
                
                const maxValue = Big(daoCore.pluginData.lockedBeams).div(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM);
                $('#m-withdraw-fee-rate').text(Utils.getRateStr(consts.GLOBAL_CONSTS.TRANSACTION_FEE_BEAM, daoCore.pluginData.rate));
                $('#m-max-avail').text(maxValue.toFixed() + ' BEAM');
                $('#m-max-avail-rate').text(Utils.getRateStr(maxValue.toFixed().length > 0 ? maxValue.toFixed() : 0, daoCore.pluginData.rate));
                const setValidState = () => {
                    $('#m-max-value-invalid').hide();
                    $('#m-w-area-avail').show();
                    $('#m-w-area-fee').show();
                    $('.m-withdraw-area__input .withdraw-area__input__text').removeClass('invalid');
                    $('.m-withdraw-area__controls__withdraw').removeClass('invalid');
                }

                $('#m-max-value-invalid').hide();

                $('#m-withdraw-cancel').click(() => {
                    $('#main-page-mobile').show();
                    $('#withdraw-mobile-page').hide();
                    $('#m-withdraw-input').val('');
                });

                $('#m-withdraw-confirm').click(() => {
                    if (daoCore.pluginData.isWVAlid) {
                        let event = new CustomEvent("global-event", {
                            detail: {
                            type: 'withdraw-process',
                            is_allocation: false,
                            amount: (Big(+$('#m-withdraw-input').val()).times(consts.GLOBAL_CONSTS.GROTHS_IN_BEAM)).toFixed()
                            }
                        });
                        document.dispatchEvent(event);
                        $('#main-page-mobile').show();
                        $('#withdraw-mobile-page').hide();
                        $('#m-withdraw-input').val('');
                    }
                })

                $('#m-withdraw-input').on('input', (event) => {
                    const value = $('#m-withdraw-input').val();
                    $('#m-withdraw-input-rate').text(Utils.getRateStr(value.length > 0 ? value : 0, daoCore.pluginData.rate));

                    daoCore.pluginData.isWVAlid = parseFloat(value.length > 0 ? value : 0) 
                        <= maxValue.toFixed();
                    if (daoCore.pluginData.isWVAlid) {
                        setValidState();
                    } else {
                        $('#m-max-value-invalid').show();
                        $('#m-max-limit-value').text(maxValue.toFixed());
                        $('#m-w-area-avail').hide();
                        $('#m-w-area-fee').hide();
                        $('.m-withdraw-area__input .withdraw-area__input__text').addClass('invalid');
                        $('.m-withdraw-area__controls__withdraw').addClass('invalid');
                    }
                });

                $('#m-withdraw-input').keydown((event) => {
                    const specialKeys = [
                        'Backspace', 'Tab', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowUp',
                        'Control', 'Delete', 'F5'
                    ];

                    if (specialKeys.indexOf(event.key) !== -1) {
                        return;
                    }

                    const current = $('#m-withdraw-input').val();
                    const next = current.concat(event.key);
                
                    if (!Utils.handleString(next)) {
                        event.preventDefault();
                    }
                })

                $('#m-withdraw-input').bind('paste', (event) => {
                    const text = event.clipboardData.getData('text');
                    if (!Utils.handleString(text)) {
                        event.preventDefault();
                    }
                })

                $('#m-add-max-control').click(() => {
                    $('#m-withdraw-input').val(maxValue.toFixed());
                    $('#m-withdraw-input-rate').text(Utils.getRateStr(maxValue, daoCore.pluginData.rate));
                    daoCore.pluginData.isWVAlid = true;
                    setValidState();
                })
            }
        });
    }
)
