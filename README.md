# imt_vis_uist21

<p align="center">
  <img src="./resources/demo_gif.gif">
</p>

This is an official repository for our UIST 21 demo paper: [Enhancing Model Assessment in Vision-based Interactive Machine Teaching through Real-time Saliency Map Visualization](https://dl.acm.org/doi/abs/10.1145/3474349.3480194).

You can **play with the online demo [here](https://zhongyizhou.net/uist21demo/index.html)**
## Quick Run
```
npm install
npm start
```
You should be able to use the system by type "http://localhost:8080/" in your browser.

## To run https locally (access via LAN):
```
chmod +x gen_keys.sh
./gen_keys.sh YOUR_IP
npm run start-https
```
## Notes
- You can edit the text of each class label by clicking on it. Be sure to press "enter" after finishing editing.
