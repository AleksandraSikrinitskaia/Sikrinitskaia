$(document).ready(function () {
    AppCS.init();
})

AppCS = {}
AppCS.userPhoneSet = new Set()
AppCS.users = new Map()

AppCS.init = function(){
    AppCS.pasteUserList();
    AppCS.dateInit();
    AppCS.registerEvents();
    AppCS.resizeFrame();
}

AppCS.dateInit = function(){
    // new Date(data[k].CALL_START_DATE)).format("dd.mm.yyyy HH:MM")
    $('input[name=date_1]').val(new Date().format("dd.mm.yyyy"))
    $('input[name=date_2]').val(new Date().format("dd.mm.yyyy"))
}

AppCS.registerEvents = function(){
    $('.filter form').submit(function(e){
        e.preventDefault;
        var $form =  $(this);
        var formData = AppCS.getFormData($form);
        AppCS.getData(formData, function(result){
            AppCS.prinData(result);
        });

        return false;
    });

    $(document).on('click', '.paginate_button', function(){
    })
}
AppCS.prinData = function(data){
    var sumData = {
        CALLS_COUNT: 0,
        DURATION_SUM: 0,
    }

    if(data.length == 0){
        $('.result').html('<br><p><center><i>Ничего не найдено</i></center></p>');
        //AppCS.resizeFrame();
        return false;
    }

    var strRes = '';
    console.log(AppCS.users);

    uniqueNumbers = new Set();

    strRes += '</tbody>';
    strRes += '</table>';
    strRes += '<br>';
    strRes += '<br>';

    var avgData = [];
    for(var k in data){

        if (AppCS.userPhoneSet.has(AppCS.normalizeNumber(data[k].PHONE_NUMBER))) {
            continue;
        }

        if(typeof avgData[userId(data[k])] == "undefined"){
            avgData[userId(data[k])] = {
                'USER_ID':data[k].PORTAL_USER_ID,
                'DURATION_SUM':0,
                'DURATION_CELL_SUM':0,
                'DURATION_AVG':0,
                'CALLS_COUNT':0,
                'UNIQUE_EXTERNAL_NUMBERS': new Set(),
                'CALL_DATE' : data[k].CALL_START_DATE.substring(0, 10)
            }
        }

        avgData[userId(data[k])]['UNIQUE_EXTERNAL_NUMBERS'].add(data[k].PHONE_NUMBER)
        avgData[userId(data[k])]['DURATION_SUM'] += parseInt(data[k]['CALL_DURATION']);

        if (data[k].REST_APP_NAME=="Виртуальная АТС от МегаФон"){
            avgData[userId(data[k])]['DURATION_CELL_SUM'] += parseInt(data[k]['CALL_DURATION']);
        }

        avgData[userId(data[k])]['CALLS_COUNT']++;
      }

    for(var k in avgData){
        avgData[k]['DURATION_AVG'] =  (avgData[k]['DURATION_SUM'] / avgData[k]['CALLS_COUNT']).toFixed(0);
    }
    var chartData = [];
    chartData[chartData.length] = ['Пользователи','Среднее время разговоора (сек.)'];


    for(var k in avgData){
        var user = AppCS.getUserByID(avgData[k].USER_ID)
        if(typeof user == 'undefined') continue;

        chartData[chartData.length] = [user.LAST_NAME+' '+user.NAME, parseInt(avgData[k].DURATION_AVG)];
    }

    var strAvg = '';
    strAvg += '<br><hr><h3>Статистика по пользователям</h3><br>';
    strAvg +=  '<div class="avg-row">';
    strAvg +=  '<div class="avg-col-item">';
    strAvg +=  '<table class="avg-table">';
    strAvg += '<thead>';
    strAvg += '<tr>';
    strAvg += '<th>Пользователь</th>';
    strAvg += '<th>Всего звонков</th>';
    strAvg += '<th>Количество уникальных звонков</th>';
    strAvg += '<th>Общее время</th>';
    strAvg += '<th>Общее время мобильные</th>';
    strAvg += '<th>Дата звонка</th>';
    strAvg += '</tr>';
    strAvg += '</thead>';
    strAvg += '<tbody>';
    for(var k in avgData){
        var user = AppCS.getUserByID(avgData[k].USER_ID)
        if(typeof user == 'undefined') continue;
        strAvg += '<tr>';
            strAvg += '<td>';
            strAvg += ' <span>'+user.LAST_NAME+' '+user.NAME+'</span>';
            strAvg += '</td>';
            strAvg += '<td>'+avgData[k].CALLS_COUNT+'</td>';
            strAvg += '<td>'+avgData[k].UNIQUE_EXTERNAL_NUMBERS.size +'</td>';
            strAvg += '<td>'+avgData[k].DURATION_SUM/60+'</td>';
            strAvg += '<td>'+avgData[k].DURATION_CELL_SUM/60+'</td>';
            strAvg += '<td>'+avgData[k].CALL_DATE+'</td>';

        strAvg += '</tr>';
    }

    strAvg += '</tbody>';
    strAvg += '</table>';
    strAvg += '</div>';
    strAvg +=  '<div class="avg-col-item"><div id="chart"></div></div>';
    strAvg += '</div>';
    strRes = strAvg + strRes;

    $('.result').html(strRes);

    $('.result-table').DataTable({
        "oLanguage": {
            "sProcessing":   "Подождите...",
            "sLengthMenu":   "Показать _MENU_ записей",
            "sZeroRecords":  "Записи отсутствуют.",
            "sInfo":         "Записи с _START_ до _END_ из _TOTAL_ записей",
            "sInfoEmpty":    "Записи с 0 до 0 из 0 записей",
            "sInfoFiltered": "(отфильтровано из _MAX_ записей)",
            "sInfoPostFix":  "",
            "sSearch":       "Поиск:",
            "sUrl":          "",
            "oPaginate": {
                "sFirst": "Первая",
                "sPrevious": "Предыдущая",
                "sNext": "Следующая",
                "sLast": "Последняя"
            }
        },
        "pageLength": 25,
        "dom": '<lf<t>ip>',
        //scrollY: 400
    });

}

AppCS.getUserByID = function(userID){
    return AppCS.users.get(userID);
}

AppCS.normalizeNumber = function(number) {
  return number.replace(/\D/g,'')
}

AppCS.pasteUserList = function($form){
    var arUser = [];

    BX24.callMethod('user.get',{}, function(result) {

        arUser = arUser.concat(result.data());
        if (result.more()) {
            result.next();
        } else {
            // end of cursor

            var strSelect
            for(var i in arUser) {

                 AppCS.users.set(arUser[i].ID, arUser[i]);

                if (arUser[i].PERSONAL_MOBILE) AppCS.userPhoneSet.add(AppCS.normalizeNumber(arUser[i].PERSONAL_MOBILE));
                if (arUser[i].PERSONAL_PHONE) AppCS.userPhoneSet.add(AppCS.normalizeNumber(arUser[i].PERSONAL_PHONE));
                if (arUser[i].WORK_PHONE) AppCS.userPhoneSet.add(AppCS.normalizeNumber(arUser[i].WORK_PHONE));

                strSelect+= '<option value="'+arUser[i].ID+'">'+arUser[i].LAST_NAME+' '+arUser[i].NAME+'</option>';
            }

            $('select[name=user]').append(strSelect);
            $('select[name=user]').select2();
        }

    });
}

AppCS.resizeFrame = function () {
    var FrameWidth = document.getElementById("call-app").offsetWidth;
    var currentSize = BX24.getScrollSize();
    minHeight = currentSize.scrollHeight;
    if (minHeight < 400) minHeight = 400;
    BX24.resizeWindow(FrameWidth, minHeight);
}


AppCS.getFormData = function($form){
    var data = {};
    var date1 = $('input[name=date_1]').val();
    var date2 = $('input[name=date_2]').val();
    if(AppCS.validateDate(date1)){
        data.date1 = date1;
    }
    if(AppCS.validateDate(date2)){
        data.date2 = date2;
    }
    var user = $('select[name=user]').val();
    if(user != 0){
        data.user = user;
    }
    var phone = $('input[name=phone]').val();
    if(phone != ''){
        data.phone = phone;
    }
    var duration = $('input[name=min_duration]').val();
    if(duration != ''){
        data.duration = duration;
    }
    data.direction = $('select[name=direction]').val();
    data.time1 = $('input[name=time_1]').val();
    data.time2 = $('input[name=time_2]').val();
    if(data.time1 == ''){
        data.time1 = '00:00'
    }
    if(data.time2 == ''){
        data.time2 = '23:59'
    }
    return data;
}

AppCS.getData = function(formData, successFunction){
    var data = [];
    var filter = {
        //'CALL_FAILED_REASON' : "Success call",
        //'>CALL_DURATION' : 0,
    };
    if(typeof formData.date1 != "undefined"){
        var dExp = explode('.',formData.date1);
        filter[">CALL_START_DATE"] = dExp[2]+'-'+dExp[1]+'-'+dExp[0]+'T'+formData.time1+':00';
    }
    if(typeof formData.date2 != "undefined"){
        var dExp = explode('.',formData.date2);
        filter["<CALL_START_DATE"] = dExp[2]+'-'+dExp[1]+'-'+dExp[0]+'T'+formData.time2+':00';
    }
    if(typeof formData.user != "undefined"){
        filter["PORTAL_USER_ID"] = formData.user ;
    }
    if(typeof formData.phone != "undefined"){
        filter["%PHONE_NUMBER"] = formData.phone ;
    }
    if(typeof formData.duration != "undefined"){
        filter[">CALL_DURATION"] = formData.duration ;
    }
    if(formData.direction != "all"){
        filter["CALL_TYPE"] = formData.direction;
    }
    var strPreloader = '<br><div class="preloader"><center><img src="img/preload.gif" alt=""></center></div>';
    $('.result').html(strPreloader);

    BX24.callMethod(
        'voximplant.statistic.get',
        {
            "FILTER": filter,
            "SORT": "CALL_START_DATE",
            "ORDER": "ASC",

        },
        function(result)
        {
            /*try {
                if(result.error()){
                    alert('error');
                    console.error(result.error());
                }
                else{
                    var arResult = result.data()
                    data = data.concat(arResult);
                    if(result.more()){
                        result.next();
                    }else{
                        successFunction(data);
                    }
                }
            } catch (err) {
                $('.result').html('<br><div><center><i class="error-text">Ошибка получения данных, попробуйте уменьшить интервал дат</i></center></div>')
                return false;
            }*/

            if(result.error()){
                alert('error');

                console.error(result.error());
            }
            else{
                var arResult = result.data()
                data = data.concat(arResult);
                if(result.more()){
                    sleep(500);
                      result.next();
                }else{
                    console.log(data);
                    successFunction(data);
                }
            }

        }
    );
}

function sleep(milliseconds) {
  const date = Date.now();
  let currentDate = null;
  do {
    currentDate = Date.now();
  } while (currentDate - date < milliseconds);
}

function userId(data) {
    return 'user_'+data.PORTAL_USER_ID + '_' + data.CALL_START_DATE.substring(0, 10);
}

AppCS.validateDate = function(value)
{
    var arrD = value.split(".");
    arrD[1] -= 1;
    var d = new Date(arrD[2], arrD[1], arrD[0]);
    if ((d.getFullYear() == arrD[2]) && (d.getMonth() == arrD[1]) && (d.getDate() == arrD[0])) {
        return true;
    } else {
        return false;
    }
}


function explode( delimiter, string ) {
    var emptyArray = { 0: '' };

    if ( arguments.length != 2
        || typeof arguments[0] == 'undefined'
        || typeof arguments[1] == 'undefined' )
    {
        return null;
    }

    if ( delimiter === ''
        || delimiter === false
        || delimiter === null )
    {
        return false;
    }

    if ( typeof delimiter == 'function'
        || typeof delimiter == 'object'
        || typeof string == 'function'
        || typeof string == 'object' )
    {
        return emptyArray;
    }

    if ( delimiter === true ) {
        delimiter = '1';
    }

    return string.toString().split ( delimiter.toString() );
}



// #####################################################################################

var dateFormat = function () {
    var	token = /d{1,4}|m{1,4}|yy(?:yy)?|([HhMsTt])\1?|[LloSZ]|"[^"]*"|'[^']*'/g,
        timezone = /\b(?:[PMCEA][SDP]T|(?:Pacific|Mountain|Central|Eastern|Atlantic) (?:Standard|Daylight|Prevailing) Time|(?:GMT|UTC)(?:[-+]\d{4})?)\b/g,
        timezoneClip = /[^-+\dA-Z]/g,
        pad = function (val, len) {
            val = String(val);
            len = len || 2;
            while (val.length < len) val = "0" + val;
            return val;
        };

    // Regexes and supporting functions are cached through closure
    return function (date, mask, utc) {
        var dF = dateFormat;

        // You can't provide utc if you skip other args (use the "UTC:" mask prefix)
        if (arguments.length == 1 && Object.prototype.toString.call(date) == "[object String]" && !/\d/.test(date)) {
            mask = date;
            date = undefined;
        }

        // Passing date through Date applies Date.parse, if necessary
        date = date ? new Date(date) : new Date;
        if (isNaN(date)) throw SyntaxError("invalid date");

        mask = String(dF.masks[mask] || mask || dF.masks["default"]);

        // Allow setting the utc argument via the mask
        if (mask.slice(0, 4) == "UTC:") {
            mask = mask.slice(4);
            utc = true;
        }

        var	_ = utc ? "getUTC" : "get",
            d = date[_ + "Date"](),
            D = date[_ + "Day"](),
            m = date[_ + "Month"](),
            y = date[_ + "FullYear"](),
            H = date[_ + "Hours"](),
            M = date[_ + "Minutes"](),
            s = date[_ + "Seconds"](),
            L = date[_ + "Milliseconds"](),
            o = utc ? 0 : date.getTimezoneOffset(),
            flags = {
                d:    d,
                dd:   pad(d),
                ddd:  dF.i18n.dayNames[D],
                dddd: dF.i18n.dayNames[D + 7],
                m:    m + 1,
                mm:   pad(m + 1),
                mmm:  dF.i18n.monthNames[m],
                mmmm: dF.i18n.monthNames[m + 12],
                yy:   String(y).slice(2),
                yyyy: y,
                h:    H % 12 || 12,
                hh:   pad(H % 12 || 12),
                H:    H,
                HH:   pad(H),
                M:    M,
                MM:   pad(M),
                s:    s,
                ss:   pad(s),
                l:    pad(L, 3),
                L:    pad(L > 99 ? Math.round(L / 10) : L),
                t:    H < 12 ? "a"  : "p",
                tt:   H < 12 ? "am" : "pm",
                T:    H < 12 ? "A"  : "P",
                TT:   H < 12 ? "AM" : "PM",
                Z:    utc ? "UTC" : (String(date).match(timezone) || [""]).pop().replace(timezoneClip, ""),
                o:    (o > 0 ? "-" : "+") + pad(Math.floor(Math.abs(o) / 60) * 100 + Math.abs(o) % 60, 4),
                S:    ["th", "st", "nd", "rd"][d % 10 > 3 ? 0 : (d % 100 - d % 10 != 10) * d % 10]
            };

        return mask.replace(token, function ($0) {
            return $0 in flags ? flags[$0] : $0.slice(1, $0.length - 1);
        });
    };
}();

// Some common format strings
dateFormat.masks = {
    "default":      "ddd mmm dd yyyy HH:MM:ss",
    shortDate:      "m/d/yy",
    mediumDate:     "mmm d, yyyy",
    longDate:       "mmmm d, yyyy",
    fullDate:       "dddd, mmmm d, yyyy",
    shortTime:      "h:MM TT",
    mediumTime:     "h:MM:ss TT",
    longTime:       "h:MM:ss TT Z",
    isoDate:        "yyyy-mm-dd",
    isoTime:        "HH:MM:ss",
    isoDateTime:    "yyyy-mm-dd'T'HH:MM:ss",
    isoUtcDateTime: "UTC:yyyy-mm-dd'T'HH:MM:ss'Z'"
};

// Internationalization strings
dateFormat.i18n = {
    dayNames: [
        "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat",
        "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"
    ],
    monthNames: [
        "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
        "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
    ]
};

// For convenience...
Date.prototype.format = function (mask, utc) {
    return dateFormat(this, mask, utc);
};

function getBeautyStrTime(seconds) {

    var seconds = parseInt(seconds);
    var h = 0;
    var m = 0;
    var s = 0;
    var h = (Math.floor(seconds / 3600))+'';
    var m = (Math.floor((seconds % 3600) / 60))+'';
    var s = (seconds % 60)+'';

    var result =  {
        H:h,
        M:m,
        S:s,
    }
    for(var k in result){
        if(result[k].length < 2){
            result[k] = '0'+result[k]
        }
    }
    return result;
}
