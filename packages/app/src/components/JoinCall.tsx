import React, { useState } from 'react';
import {
  Button,
  List,
  ListItem,
  ListSubheader,
  TextField,
} from '@mui/material';
import SwitchVideo from '@mui/icons-material/SwitchVideo';

export const JoinCall = (props: { joinCall?: (id: string) => void }) => {
  const { joinCall } = props;
  const [callId, setCallId] = useState('');
  return (
    <>
      <List
        subheader={<ListSubheader component="div">Join call</ListSubheader>}
      >
        <ListItem>
          <TextField
            label="Call ID"
            variant="outlined"
            fullWidth
            value={callId}
            onChange={(e) => setCallId(e.target.value)}
          />
        </ListItem>
      </List>
      <Button
        variant="contained"
        fullWidth
        startIcon={<SwitchVideo />}
        sx={{ mt: 1 }}
        disabled={!callId || !joinCall}
        onClick={() => {
          if (joinCall && callId) {
            joinCall(callId);
          }
        }}
      >
        Join call
      </Button>
    </>
  );
};
