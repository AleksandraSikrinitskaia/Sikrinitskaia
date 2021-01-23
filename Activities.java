package com.calls;

import com.calls.model.activity.Activity;
import com.calls.model.activity.ActivityResponse;
import com.mashape.unirest.http.Unirest;
import lombok.SneakyThrows;
import lombok.extern.slf4j.Slf4j;
import lombok.var;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static com.calls.App.OBJECT_MAPPER;
import static com.calls.App.RATE_LIMITER;
import static com.calls.App.URL;
import static com.calls.CallUnirest.exec;
import static com.mashape.unirest.http.utils.URLParamEncoder.encode;
import static java.time.format.DateTimeFormatter.ISO_LOCAL_DATE_TIME;
import static java.util.Optional.empty;
import static java.util.Optional.of;

@Slf4j
public class Activities {

    enum OwnerType {

        COMPANY(4);

        public int id;

        OwnerType(int id) {
            this.id = id;
        }
    }

    public static List<Activity> findCompletedActivities(
        Optional<OffsetDateTime> startTime,
        Optional<OffsetDateTime> endTime,
        Optional<OwnerType> ownerType
    ) {
        log.info("Activity retrieving started");

        var activities = new ArrayList<Activity>();
        Optional<Integer> startFrom = empty();

        while (true) {

            var response = findCompletedActivities(startFrom, startTime, endTime, ownerType);

            activities.addAll(response.result);

            if (response.next == null) {
                break;
            } else {
                startFrom = of(response.next);
            }
        }

        log.info("Activity retrieving finished");

        return activities;
    }

    @SneakyThrows
    private static ActivityResponse findCompletedActivities(
        Optional<Integer> start,
        Optional<OffsetDateTime> startTime,
        Optional<OffsetDateTime> endTime,
        Optional<OwnerType> ownerType
    ) {
        RATE_LIMITER.acquire();

        var strRequest = URL + "/crm.activity.list" + "?" +
            encode("FILTER[COMPLETED]") + "=Y";

        if (startTime.isPresent()) {
            strRequest += "&" + encode("FILTER[>=CREATED]") + "=" + startTime.get().format(ISO_LOCAL_DATE_TIME);
        }

        if (endTime.isPresent()) {
            strRequest += "&" + encode("FILTER[<CREATED]") + "=" + endTime.get().format(ISO_LOCAL_DATE_TIME);
        }

        if (ownerType.isPresent()) {
            strRequest += "&" + encode("FILTER[OWNER_TYPE_ID]") + "=" + ownerType.get().id;
        }

        if (start.isPresent()) {
            strRequest += "&start=" + start.get();
        }

        var getRequest = Unirest.get(strRequest);
        var response = exec(getRequest);

        return OBJECT_MAPPER.readValue(response.getBody(), ActivityResponse.class);
    }
}
