#!/bin/sh
{
    date=`date "+%d-%m-%y %H:%M:%S"`
    echo "${date}: Pushing notif schedule"

    # Warm up function
    ret=`curl -H "cypress: 42" https://greenlife-quote-pusher.yannvr.now.sh/api/warmup`

    echo "Warm up ret: $ret"

    if [ $ret = "HOT" ] ; then
        sleep 1
        # Execute function (hopefully)
        ret=`curl -H "cypress: 42" https://greenlife-quote-pusher.yannvr.now.sh/api/broadcast-quote`
        echo "PUSH ret: ${ret}"
        if [ $ret = "OK" ] ; then
            echo "${date}: OK"
        else
            # Re execute lambda
            echo "${date}: FAILURE broadcast (RETRY)"
            /bin/sh /home/ubuntu/GreenLife/send-broadcast.sh
        fi
    else
        # Re execute lambda
        echo "${date}: FAILURE warmup (RETRY)" >> /var/log/cron.greenlife
        /bin/sh /home/ubuntu/GreenLife/send-broadcast.sh

    fi

} >> /var/log/cron.greenlife
