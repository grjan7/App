import React, {useEffect, useState} from 'react';
import {Camera} from 'react-native-vision-camera';
import {useTabAnimation} from '@react-navigation/material-top-tabs';
import {useNavigation} from '@react-navigation/native';
import PropTypes from 'prop-types';
import refPropTypes from '../../../components/refPropTypes';

const propTypes = {
    /* The index of the tab that contains this camera */
    cameraTabIndex: PropTypes.number.isRequired,

    /* Forwarded ref */
    forwardedRef: refPropTypes.isRequired,
};

// Wraps a camera that will only be active when the tab is focused or as soon as it starts to become focused.
function NavigationAwareCamera({cameraTabIndex, forwardedRef, ...props}) {
    // Get navigation to get initial isFocused value (only needed once during init!)
    const navigation = useNavigation();
    const [isCameraActive, setIsCameraActive] = useState(navigation.isFocused());

    // Retrieve the animation value from the tab navigator, which ranges from 0 to the total number of pages displayed.
    // Even a minimal scroll towards the camera page (e.g., a value of 0.001 at start) should activate the camera for immediate responsiveness.
    const tabPositionAnimation = useTabAnimation();

    useEffect(() => {
        const listenerId = tabPositionAnimation.addListener(({value}) => {
            // Activate camera as soon the index is animating towards the `cameraTabIndex`
            setIsCameraActive(value > cameraTabIndex - 1 && value < cameraTabIndex + 1);
        });

        return () => {
            tabPositionAnimation.removeListener(listenerId);
        };
    }, [cameraTabIndex, tabPositionAnimation]);

    // Note: The useEffect can be removed once VisionCamera V3 is used.
    // Its only needed for android, because there is a native cameraX android bug. With out this flow would break the camera:
    // 1. Open camera tab
    // 2. Take a picture
    // 3. Go back from the opened screen
    // 4. The camera is not working anymore
    useEffect(() => {
        const removeBlurListener = navigation.addListener('blur', () => {
            setIsCameraActive(false);
        });
        const removeFocusListener = navigation.addListener('focus', () => {
            setIsCameraActive(true);
        });

        return () => {
            removeBlurListener();
            removeFocusListener();
        };
    }, [navigation]);

    return (
        <Camera
            ref={forwardedRef}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
            isActive={isCameraActive}
        />
    );
}

NavigationAwareCamera.propTypes = propTypes;
NavigationAwareCamera.displayName = 'NavigationAwareCamera';

export default React.forwardRef((props, ref) => (
    <NavigationAwareCamera
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
        forwardedRef={ref}
    />
));
