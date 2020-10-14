#!/bin/sh
date=`date "+%d-%m-%y%H:%M:%S"`
echo "${date}: Pushing notif schedule" >> /var/log/cron.greenlife

# Warm up function
curl -H "cypress: 42" https://greenlife-quote-pusher.yannvr.now.sh/api/warmup

if [ $? -ne 0 ] ; then
    # Re execute lambda
    echo "${date}: FAILURE warmup (RETRY)" >> /var/log/cron.greenlife
    /bin/sh /home/ubuntu/GreenLife/send-test-broadcast.sh
    exit
fi

sleep 1

# Execute function (hopefully)
curl -H "cypress: 42" https://greenlife-quote-pusher.yannvr.now.sh/api/broadcast-quote

if [ $? -ne 0 ] ; then
    # Re execute lambda
    echo "${date}: FAILURE broadcast (RETRY)" >> /var/log/cron.greenlife
    /bin/sh /home/ubuntu/GreenLife/send-test-broadcast.sh
    exit
fi

echo "${date}: OK" >> /var/log/cron.greenlife
