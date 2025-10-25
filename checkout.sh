#!/usr/bin/env bash
stripe trigger checkout.session.completed \
  --add checkout_session:metadata.donationType="onetime" \
  --add checkout_session:metadata.firstName="FirstName" \
  --add checkout_session:metadata.lastName="Last" \
  --add checkout_session:metadata.idCode="030398-14512" \
  --add checkout_session:metadata.amounts="[{\"organizationId\":1,\"amount\":3000}]"