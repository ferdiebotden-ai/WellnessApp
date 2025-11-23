import { apiApp } from './api';

const PORT = Number.parseInt(process.env.PORT || '8080', 10);

apiApp.listen(PORT, () => {
  console.log(`Wellness OS API listening on port ${PORT}`);
});

