import Utils from "./libs/utils.js";
import * as consts from "./consts/consts.js";

const CONTRACT_ID = "2f4a3a736b10e8a217ff23a8f7fa20959431ab3d1fe3226d044101ee5007e6da";
const REJECTED_CALL_ID = -32021;
const IN_PROGRESS_ID = 5;
const TIMEOUT = 3000;

class DaoCore {
    constructor() {
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
                }
            }
        };
    }

    setError = (errmsg) => {
        let errorElementId = "#error-common";
        if ($('#main-page').css('display') === 'none') {
            errorElementId = "#error-full";
            $('#error-full-container').show();
        } else {
            $('#error-common').show();
        }

        $(errorElementId).text(errmsg);
        if (this.timeout) {
            clearTimeout(this.timeout);   
        }
        this.timeout = setTimeout(() => {
            $(errorElementId).text(errmsg);
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
        const depositComponent = this.pluginData.yieldType === 'deposit' 
            ? $('deposit-popup-component')
            : $('staking-component');
        depositComponent.attr('yeild', res.yield);
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
            (...args) => this.onSendToChain(...args)
        )
    }

    onMyXIDLoaded = (err, res) => {
        $('public-key-popup-component').attr('key', res.xid);
    }

    onApiResult = (json) => {    
        try {
            const apiAnswer = JSON.parse(json);
            console.log('api result:', apiAnswer);
            const apiCallId = apiAnswer.id;
            let apiResult;

            if (apiAnswer.error !== undefined) {
                if (apiAnswer.error.code === REJECTED_CALL_ID) {
                    apiResult = apiAnswer.error;
                } else {
                    throw JSON.stringify(apiAnswer.error)
                }
            } else {
                apiResult = apiAnswer.result;
                if (!apiResult) {
                    throw "Failed to call wallet API";
                }
            }
        } catch(err) {
            return this.setError(err.toString());
        }
    }

    hidePopups() {
        $('public-key-popup-component').hide();
        $('claim-rewards-popup-component').hide();
        $('deposit-popup-component').hide();
        $('withdraw-popup-component').hide();
        $('info-popup-component').hide();
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

        document.addEventListener("global-event", (e) => { 
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
            }
        });
    }
)
